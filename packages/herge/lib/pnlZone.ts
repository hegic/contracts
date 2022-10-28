import { BigNumber, constants } from "ethers"
import { calculateStrikes } from "./strikes"
import type { PNLZone } from "./IPNLZone"
import { getStrategyInfo, type StrategyName } from "./Strategy"

export function calculatePNLZone(
  strategy: StrategyName,
  amount: BigNumber,
  price_0: BigNumber,
  positivepnl: BigNumber,
): PNLZone {
  const currency = strategy.match(/ETH|BTC/)![0]
  const decimals = BigNumber.from(10).pow(currency == "BTC" ? 10 : 20)
  const stratInfo = getStrategyInfo(strategy)

  switch (stratInfo.type) {
    case "STRADDLE":
    case "STRIP":
    case "STRAP": {
      const [rValue, lValue] = calculateBreakEven(
        strategy,
        amount,
        price_0,
        positivepnl,
      )
      return {
        left: { profit: true, value: lValue },
        center: { profit: false, from: price_0, to: price_0 },
        right: { profit: true, value: rValue },
      }
    }

    case "STRANGLE": {
      const [lValue, rValue] = calculateBreakEven(
        strategy,
        amount,
        price_0,
        positivepnl,
      )
      const [p0, p1] = calculateStrikes(strategy, price_0)
      return {
        left: { profit: true, value: lValue },
        center: { profit: false, from: p0, to: p1 },
        right: { profit: true, value: rValue },
      }
    }

    case "SPREAD_PUT": {
      const STRIKE_PUT = price_0.sub(
        price_0.mul(stratInfo.strike || 0).div(100),
      )
      const [value] = calculateBreakEven(
        strategy,
        amount,
        price_0,
        positivepnl,
      )
      return {
        left: { profit: true, value },
        right: { profit: false, value: price_0 },
      }
    }

    case "PUT": {
      const STRIKE_PUT = price_0.mul(stratInfo.strike).div(100)
      //.sub(
      //   price_0.mul(stratInfo.strike || 0).div(100),
      // )
      const [value] = calculateBreakEven(
        strategy,
        amount,
        STRIKE_PUT,
        positivepnl,
      )
      return {
        left: { profit: true, value },
        right: { profit: false, value: STRIKE_PUT },
      }
    }
    case "SPREAD_CALL": {
      const STRIKE_CALL = price_0.add(
        price_0.mul(stratInfo.strike || 0).div(100),
      )
      const [value] = calculateBreakEven(
        strategy,
        amount,
        price_0,
        positivepnl,
      )
      return {
        right: { profit: true, value },
        left: { profit: false, value: price_0 },
      }
    }
    case "CALL": {
      const STRIKE_CALL = price_0.mul(stratInfo.strike).div(100)
      const [value] = calculateBreakEven(
        strategy,
        amount,
        STRIKE_CALL,
        positivepnl,
      )
      return {
        right: { profit: true, value },
        left: { profit: false, value: STRIKE_CALL },
      }
    }
    case "INVERSE_BULL_PUT_SPREAD": {
      const [otms, atms] = calculateStrikes(strategy, price_0)
      const negativepnl = (atms.sub(otms).mul(amount).div(decimals)).sub(positivepnl)
      return {
        right: {
          profit: true,
          value: amount
            .mul(atms)
            .sub((negativepnl).mul(decimals))
            .div(amount),
        },
        left: {
          profit: false,
          value: otms,
        },
      }
    }

    case "INVERSE_BEAR_CALL_SPREAD":
      const [atms, otms] = calculateStrikes(strategy, price_0)
      const negativepnl = (otms.sub(atms).mul(amount).div(decimals)).sub(positivepnl)

      return {
        right: {
          profit: false,
          value: otms,
        },
        left: {
          profit: true,
          value: amount
            .mul(price_0)
            .add((negativepnl).mul(decimals))
            .div(amount),
        },
      }

    case "INVERSE_LONG_BUTTERFLY": {
      const [otmput, atms, otmcall] = calculateStrikes(strategy, price_0)
      const d1 = atms.sub(otmput)
      const d2 = otmcall.sub(atms)
      const d = d1.gt(d2) ? d1 : d2
      // console.log(otmput, atms, otmcall)
      const negativepnl = (d.mul(amount).div(decimals)).sub(positivepnl)

      return {
        right: {
          profit: false,
          value: otmcall,
        },
        center: {
          profit: true,
          from: amount
            .mul(price_0)
            .sub((negativepnl).mul(decimals))
            .div(amount),
          to: amount
            .mul(price_0)
            .add((negativepnl).mul(decimals))
            .div(amount),
        },
        left: {
          profit: false,
          value: otmput,
        },
      }
    }
    case "INVERSE_LONG_CONDOR": {
      const [, p0, p1, p2, p3] = calculateStrikes(strategy, price_0)
      const d1 = p1.sub(p0)
      const d2 = p3.sub(p2)
      const d = d1.gt(d2) ? d1 : d2

      const negativepnl = (d.mul(amount).div(decimals)).sub(positivepnl)


      return {
        right: {
          profit: false,
          value: p3,
        },
        center: {
          profit: true,
          from: amount
            .mul(p1)
            .sub((negativepnl).mul(decimals))
            .div(amount),
          to: amount
            .mul(p2)
            .add((negativepnl).mul(decimals))
            .div(amount),
        },
        left: {
          profit: false,
          value: p0,
        },
      }
    }
    default:
      throw new Error("Wrong stratagy: " + strategy)
  }
}

function calculateBreakEven(
  strategy: StrategyName,
  amount: BigNumber,
  strike: BigNumber,
  premium: BigNumber,
): BigNumber[] {
  const currency = strategy.match(/ETH|BTC/)![0]
  const decimals = BigNumber.from(10).pow(currency == "BTC" ? 10 : 20)
  const stratInfo = getStrategyInfo(strategy)

  switch (stratInfo.type) {
    case "STRADDLE":
      return [
        amount.mul(strike).add(premium.mul(decimals)).div(amount),
        amount.mul(strike).sub(premium.mul(decimals)).div(amount),
      ]
    case "STRAP":
      return [
        amount.mul(2).mul(strike).add(premium.mul(decimals)).div(amount.mul(2)),
        amount.mul(strike).sub(premium.mul(decimals)).div(amount),
      ]
    case "STRIP":
      return [
        amount.mul(strike).add(premium.mul(decimals)).div(amount),
        amount.mul(2).mul(strike).sub(premium.mul(decimals)).div(amount.mul(2)),
      ]
    case "PUT":
    case "SPREAD_PUT":
      return [amount.mul(strike).sub(premium.mul(decimals)).div(amount)]
    case "CALL":
    case "SPREAD_CALL":
      return [amount.mul(strike).add(premium.mul(decimals)).div(amount)]
    case "STRANGLE": {
      const STRIKE_STRANGLE_PUT = strike.sub(
        strike.mul(stratInfo.strike).div(100),
      )
      const STRIKE_STRANGLE_CALL = strike.add(
        strike.mul(stratInfo.strike).div(100),
      )
      return [
        amount.mul(STRIKE_STRANGLE_PUT).sub(premium.mul(decimals)).div(amount),
        amount.mul(STRIKE_STRANGLE_CALL).add(premium.mul(decimals)).div(amount),
      ]
    }
  }
  return [constants.One]
}
