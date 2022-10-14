import type {BigNumber} from "ethers"
import {getStrategyInfo, type StrategyName} from "./Strategy"

export function calculateStrikes(
  strategy: StrategyName,
  strikePoint: BigNumber,
): BigNumber[] {
  const strat = getStrategyInfo(strategy)
  switch (strat.type) {
    case "PUT":
    case "CALL":
      return [strikePoint.mul(strat.strike).div(100)]
    case "INVERSE_LONG_CONDOR":
      return [
        strikePoint,
        strikePoint.sub(strikePoint.mul(strat.strike).div(100)), //buy 20% or 30% otm-put strike
        strikePoint.sub(strikePoint.mul(10).div(100)), //sell 10% otm-put strike
        strikePoint.add(strikePoint.mul(10).div(100)), //sell 10% otm-call strike
        strikePoint.add(strikePoint.mul(strat.strike).div(100)), //buy 20% or 30% otm-call strike
      ]
    case "INVERSE_LONG_BUTTERFLY":
      return [
        strikePoint.sub(strikePoint.mul(strat.strike).div(100)), //buy otm-put strike
        strikePoint, //sell 10% atm strike
        strikePoint.add(strikePoint.mul(strat.strike).div(100)), //buy otm-call strike
      ]
    case "INVERSE_BEAR_CALL_SPREAD":
    case "SPREAD_CALL":
      return [
        strikePoint,
        strikePoint.add(strikePoint.mul(strat.strike).div(100)),
      ]
    case "INVERSE_BULL_PUT_SPREAD":
    case "SPREAD_PUT":
      return [
        strikePoint.sub(strikePoint.mul(strat.strike).div(100)),
        strikePoint,
      ]
    case "STRANGLE":
      return [
        strikePoint.sub(strikePoint.mul(strat.strike).div(100)),
        strikePoint.add(strikePoint.mul(strat.strike).div(100)),
      ]
    case "STRAP":
    case "STRIP":
    case "STRADDLE":
      return [strikePoint]
    default:
      throw new Error("WrongStratagy: " + strategy)
  }
}
