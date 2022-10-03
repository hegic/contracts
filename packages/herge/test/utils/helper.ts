import {BigNumber} from "ethers"
import {formatUnits, parseUnits} from "ethers/lib/utils"
import {ethers} from "hardhat"

const ethDecimals = parseUnits("1", 20)
const btcDecimals = parseUnits("1", 10)

const availableDecimals = {
  ETH: ethDecimals,
  BTC: btcDecimals,
}

const strapLeg = {
  CALL: parseUnits("2", 0),
  PUT: parseUnits("1", 0),
}

const stripLeg = {
  CALL: parseUnits("1", 0),
  PUT: parseUnits("2", 0),
}

export function getProfitByUserBN(
  userShare: BigNumber,
  startCoverBalance: BigNumber,
  finishCoverBalance: BigNumber,
  totalShare: BigNumber,
) {
  let profit = finishCoverBalance.sub(startCoverBalance)
  let userBalance = userShare.mul(profit).div(totalShare)
  return userBalance
}

export function getMaxPayOut(
  coverPoolBalance: BigNumber,
  hegicPrice: BigNumber,
) {
  let maxPayOff = coverPoolBalance.mul(hegicPrice).div(1e30)

  return maxPayOff
}

export function getPutPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = strike
    .sub(exercisePrice)
    .mul(amount)
    .div(availableDecimals[asset])
  return payoff
}

export function getCallPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = exercisePrice
    .sub(strike)
    .mul(amount)
    .div(availableDecimals[asset])
  return payoff
}

export function getStrapCallLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = exercisePrice
    .sub(strike)
    .mul(amount)
    .mul(strapLeg["CALL"])
    .div(availableDecimals[asset])
  return payoff
}

export function getStrapPutLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = strike
    .sub(exercisePrice)
    .mul(amount)
    .mul(strapLeg["PUT"])
    .div(availableDecimals[asset])
  return payoff
}

export function getStripCallLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = exercisePrice
    .sub(strike)
    .mul(amount)
    .mul(stripLeg["CALL"])
    .div(availableDecimals[asset])
  return payoff
}

export function getStripPutLegPayOff(
  strike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = strike
    .sub(exercisePrice)
    .mul(amount)
    .mul(stripLeg["PUT"])
    .div(availableDecimals[asset])
  return payoff
}

export function getInverseCallPayOff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = buyOtmStrike
    .sub(exercisePrice)
    .mul(amount)
    .div(availableDecimals[asset])
  return payoff
}

export function getInversePutPayOff(
  buyOtmStrike: BigNumber,
  exercisePrice: BigNumber,
  amount: BigNumber,
  asset: "ETH" | "BTC",
) {
  let payoff = exercisePrice
    .sub(buyOtmStrike)
    .mul(amount)
    .div(availableDecimals[asset])
  return payoff
}

export default {
  getProfitByUserBN,
  getMaxPayOut,
  getCallPayOff,
  getStrapCallLegPayOff,
  getStrapPutLegPayOff,
  getStripCallLegPayOff,
  getStripPutLegPayOff,
  getInverseCallPayOff,
  getInversePutPayOff,
}
