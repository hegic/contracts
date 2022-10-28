import {
  type StrategyName,
  type StrategyType,
  availableStrategies,
} from "./IStrategy"
export {StrategyName, StrategyType}

const stratagyRegex = /^HegicStrategy_([A-Z_]*)(_(\d+))?_(ETH|BTC)?$/
// /^HegicStrategy_(?<type>[A-Z_]*)(_(?<strike>\d+))?_(?<asset>ETH|BTC)?$/

export function getStrategyInfo(strat: StrategyName) {
  const res = strat.match(stratagyRegex)
  if (!res) throw new Error("WrongStratagy: " + strat)
  return {
    type: res[1] as StrategyType,
    strike: res[3],
    asset: res[4] as "ETH" | "BTC",
  }
  // return res as {type: StrategyType; strike: string; asset: "ETH" | "BTC"}
}

export function assertStrategy(
  strategy: string,
): asserts strategy is StrategyName {
  if (availableStrategies.indexOf(strategy as any) < 0)
    throw new Error(`'${strategy}' is not an available strategy`)
}
