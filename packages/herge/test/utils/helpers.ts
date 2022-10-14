import type {BigNumber} from "ethers"
import {counters} from "../../lib/payoff"
export const {
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
} = counters

export function getProfitByUserBN(
  userShare: BigNumber,
  startCoverBalance: BigNumber,
  finishCoverBalance: BigNumber,
  totalShare: BigNumber,
) {
  let profit = finishCoverBalance.sub(startCoverBalance)
  return userShare.mul(profit).div(totalShare)
}

export function getMaxPayOut(
  coverPoolBalance: BigNumber,
  hegicPrice: BigNumber,
) {
  return coverPoolBalance.mul(hegicPrice).div(1e30)
}
