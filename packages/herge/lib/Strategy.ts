import {
  type StrategyName,
  type StrategyType,
  availableStrategies,
} from "./IStrategy"
export {StrategyName, StrategyType}

const stratagyRegex = /^HegicStrategy(_v(\d))?_([A-Z_]*)(_(\d+))?_(ETH|BTC)(_([1-4]))?$/
// /^HegicStrategy_(?<type>[A-Z_]*)(_(?<strike>\d+))?_(?<asset>ETH|BTC)?$/

export function getStrategyInfo(strat: StrategyName) {
  const res = strat.match(stratagyRegex)
  if (!res) throw new Error("WrongStratagy: " + strat)
  return {
    version: res[2],
    type: res[3] as StrategyType,
    strike: res[5],
    asset: res[6] as "ETH" | "BTC",
    periodType: res[8] && Number(res[8]) as 1|2|3|4|undefined,
  }
  // return res as {type: StrategyType; strike: string; asset: "ETH" | "BTC"}
}

export function assertStrategy(
  strategy: string,
): asserts strategy is StrategyName {
  if (availableStrategies.indexOf(strategy as any) < 0)
    throw new Error(`'${strategy}' is not an available strategy`)
}
