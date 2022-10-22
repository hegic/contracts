import { type BigNumber, constants } from "ethers"
import { parseUnits } from "ethers/lib/utils"
import { calculateStrikes } from "./strikes"

import { getStrategyInfo, type StrategyName } from "./Strategy"

export function calculatePayoff(
  strategy: StrategyName,
  amount: BigNumber,
  baseStrike: BigNumber,
  price: BigNumber,
): BigNumber {
  const stratInfo = getStrategyInfo(strategy)

  switch (stratInfo.type) {
    case "CALL": {
      const [strikePoint] = calculateStrikes(strategy, baseStrike)
      if (price.gt(strikePoint))
        return getCallPayOff(strikePoint, price, amount, stratInfo.asset)
      else return constants.Zero
    }

    case "PUT": {
      const [strikePoint] = calculateStrikes(strategy, baseStrike)
      if (price.lt(strikePoint))
        return getPutPayOff(strikePoint, price, amount, stratInfo.asset)
      else return constants.Zero
    }

    case "STRADDLE": {
      const [atmStrike] = calculateStrikes(strategy, baseStrike)
      if (price.gt(atmStrike))
        return getCallPayOff(atmStrike, price, amount, stratInfo.asset)
      else return getPutPayOff(atmStrike, price, amount, stratInfo.asset)
    }

    case "STRAP": {
      const [atmStrike] = calculateStrikes(strategy, baseStrike)
      if (price.gt(atmStrike))
        return getStrapCallLegPayOff(atmStrike, price, amount, stratInfo.asset)
      else
        return getStrapPutLegPayOff(atmStrike, price, amount, stratInfo.asset)
    }
    case "STRIP": {
      const [atmStrike] = calculateStrikes(strategy, baseStrike)
      if (price.gt(atmStrike))
        return getStripCallLegPayOff(atmStrike, price, amount, stratInfo.asset)
      else
        return getStripPutLegPayOff(atmStrike, price, amount, stratInfo.asset)
    }
    case "STRANGLE": {
      const [otmPut, otmCall] = calculateStrikes(strategy, baseStrike)
      if (price.gt(otmCall))
        return getCallPayOff(otmCall, price, amount, stratInfo.asset)
      else return getPutPayOff(otmPut, price, amount, stratInfo.asset)
    }

    case "SPREAD_CALL": {
      const [atmCallStrike, otmCallStrike] = calculateStrikes(
        strategy,
        baseStrike,
      )
      if (price.gt(atmCallStrike))
        return getBullCallSpreadPayOff(
          atmCallStrike,
          otmCallStrike,
          price,
          amount,
          stratInfo.asset,
        )
      else return constants.Zero
    }

    case "SPREAD_PUT": {
      const [otmCallStrike, atmCallStrike] = calculateStrikes(
        strategy,
        baseStrike,
      )
      if (price.lt(atmCallStrike))
        return getBearPutSpreadPayOff(
          atmCallStrike,
          otmCallStrike,
          price,
          amount,
          stratInfo.asset,
        )
      else return constants.Zero
    }

    case "INVERSE_LONG_BUTTERFLY": {
      const [otmPutStrike, atmStrike, otmCallStrike] = calculateStrikes(
        strategy,
        baseStrike,
      )
      if (price.gt(atmStrike))
        return getLongButterflyCallLegPayoff(
          otmCallStrike,
          price,
          amount,
          stratInfo.asset,
        )
      else
        return getLongButterflyPutLegPayoff(
          otmPutStrike,
          price,
          amount,
          stratInfo.asset,
        )
    }

    case "INVERSE_LONG_CONDOR": {
      const [
        strikePoint,
        buyOtmPutStrike,
        sellOtmPutStrike,
        sellOtmCallStrike,
        buyOtmCallStrike,
      ] = calculateStrikes(strategy, baseStrike)

      if (price.lt(buyOtmPutStrike)) return constants.Zero
      else if (price.lt(sellOtmPutStrike))
        return getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          price,
          amount,
          stratInfo.asset,
        )
      else if (price.lt(strikePoint))
        return getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          sellOtmPutStrike,
          amount,
          stratInfo.asset,
        )
      else if (price.lt(sellOtmCallStrike))
        return getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          sellOtmCallStrike,
          amount,
          stratInfo.asset,
        )
      else if (price.lt(buyOtmCallStrike))
        return getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          price,
          amount,
          stratInfo.asset,
        )
      else return constants.Zero
    }

    case "INVERSE_BEAR_CALL_SPREAD": {
      const [strikePoint, buyOtmCallStrike] = calculateStrikes(
        strategy,
        baseStrike,
      )

      if (price.lt(strikePoint))
        return getBearCallSpreadPayoff(
          buyOtmCallStrike,
          strikePoint,
          amount,
          stratInfo.asset,
        )
      else if (price.lt(buyOtmCallStrike))
        return getBearCallSpreadPayoff(
          buyOtmCallStrike,
          price,
          amount,
          stratInfo.asset,
        )
      else return constants.Zero
    }

    case "INVERSE_BULL_PUT_SPREAD": {
      const [buyOtmPutStrike, strikePoint] = calculateStrikes(
        strategy,
        baseStrike,
      )

      if (price.lt(buyOtmPutStrike))
        return getBullPutSpreadPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          amount,
          stratInfo.asset,
        )

      else if (price.lt(strikePoint))
        return getBullPutSpreadPayoff(
          buyOtmPutStrike,
          price,
          amount,
          stratInfo.asset,
        )

      else return getBullPutSpreadPayoff(
        buyOtmPutStrike,
        strikePoint,
        amount,
        stratInfo.asset,
      )
    }

    default:
      throw new Error("Wrong stratagy: " + strategy)
  }
}

const availableDecimals = {
  ETH: parseUnits("1", 20),
  BTC: parseUnits("1", 10),
}

const strapLeg = {
  CALL: 2,
  PUT: 1,
}

const stripLeg = {
  CALL: 1,
  PUT: 2,
}

function getPutPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.lt(strike))
    return strike.sub(exercisePrice).mul(amount).div(availableDecimals[asset])
  else return constants.Zero
}

function getBearPutSpreadPayOff(
  strike: BigNumber,
  otmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.gt(otmStrike))
    if (exercisePrice.lt(strike))
      return strike.sub(exercisePrice).mul(amount).div(availableDecimals[asset])
    else return constants.Zero
  else return strike.sub(otmStrike).mul(amount).div(availableDecimals[asset])
}

function getCallPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.gt(strike))
    return exercisePrice.sub(strike).mul(amount).div(availableDecimals[asset])
  else return constants.Zero
}

function getBullCallSpreadPayOff(
  strike: BigNumber,
  otmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.lt(otmStrike))
    if (exercisePrice.gt(strike))
      return exercisePrice.sub(strike).mul(amount).div(availableDecimals[asset])
    else return constants.Zero
  else return otmStrike.sub(strike).mul(amount).div(availableDecimals[asset])
}

function getStrapCallLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.gt(strike))
    return exercisePrice
      .sub(strike)
      .mul(amount)
      .mul(strapLeg["CALL"])
      .div(availableDecimals[asset])
  else return constants.Zero
}

function getStrapPutLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.lt(strike))
    return strike
      .sub(exercisePrice)
      .mul(amount)
      .mul(strapLeg["PUT"])
      .div(availableDecimals[asset])
  else return constants.Zero
}

function getStripCallLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.gt(strike))
    return exercisePrice
      .sub(strike)
      .mul(amount)
      .mul(stripLeg["CALL"])
      .div(availableDecimals[asset])
  else return constants.Zero
}

function getStripPutLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.lt(strike))
    return strike
      .sub(exercisePrice)
      .mul(amount)
      .mul(stripLeg["PUT"])
      .div(availableDecimals[asset])
  else return constants.Zero
}

function getLongButterflyCallLegPayoff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.lt(buyOtmStrike))
    return buyOtmStrike
      .sub(exercisePrice)
      .mul(amount)
      .div(availableDecimals[asset])
  else return constants.Zero
}

function getLongCondorCallLegPayoff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  return buyOtmStrike
    .sub(exercisePrice)
    .mul(amount)
    .div(availableDecimals[asset])
}

function getBearCallSpreadPayoff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  return buyOtmStrike
    .sub(exercisePrice)
    .mul(amount)
    .div(availableDecimals[asset])
}

function getBullPutSpreadPayoff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  return exercisePrice
    .sub(buyOtmStrike)
    .mul(amount)
    .div(availableDecimals[asset])
}

function getLongButterflyPutLegPayoff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  if (exercisePrice.gt(buyOtmStrike))
    return exercisePrice
      .sub(buyOtmStrike)
      .mul(amount)
      .div(availableDecimals[asset])
  else return constants.Zero
}

function getLongCondorPutLegPayoff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  return exercisePrice
    .sub(buyOtmStrike)
    .mul(amount)
    .div(availableDecimals[asset])
}

export const counters = {
  getPutPayOff,
  getBearPutSpreadPayOff,
  getCallPayOff,
  getBullCallSpreadPayOff,
  getStrapCallLegPayOff,
  getStrapPutLegPayOff,
  getStripCallLegPayOff,
  getStripPutLegPayOff,
  getLongButterflyCallLegPayoff,
  getLongCondorCallLegPayoff,
  getBearCallSpreadPayoff,
  getBullPutSpreadPayoff,
  getLongButterflyPutLegPayoff,
  getLongCondorPutLegPayoff,
}
