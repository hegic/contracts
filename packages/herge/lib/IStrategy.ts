export type StrategyName = typeof availableStrategies[number]

export const inverseStrategies = [
  "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH",
  "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC",
  "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_20_ETH",
  "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_20_BTC",
  "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_30_ETH",
  "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_30_BTC",
  "HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH",
  "HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC",
  "HegicStrategy_INVERSE_BULL_PUT_SPREAD_20_ETH",
  "HegicStrategy_INVERSE_BULL_PUT_SPREAD_20_BTC",
  "HegicStrategy_INVERSE_BULL_PUT_SPREAD_30_ETH",
  "HegicStrategy_INVERSE_BULL_PUT_SPREAD_30_BTC",
  "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
  "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC",
  "HegicStrategy_INVERSE_LONG_BUTTERFLY_20_ETH",
  "HegicStrategy_INVERSE_LONG_BUTTERFLY_20_BTC",
  "HegicStrategy_INVERSE_LONG_BUTTERFLY_30_ETH",
  "HegicStrategy_INVERSE_LONG_BUTTERFLY_30_BTC",
  "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
  "HegicStrategy_INVERSE_LONG_CONDOR_20_BTC",
  "HegicStrategy_INVERSE_LONG_CONDOR_30_ETH",
  "HegicStrategy_INVERSE_LONG_CONDOR_30_BTC",
] as const

export const classicStrategies = [
  "HegicStrategy_PUT_100_ETH",
  "HegicStrategy_PUT_90_ETH",
  "HegicStrategy_PUT_80_ETH",
  "HegicStrategy_PUT_70_ETH",
  "HegicStrategy_PUT_100_BTC",
  "HegicStrategy_PUT_90_BTC",
  "HegicStrategy_PUT_80_BTC",
  "HegicStrategy_PUT_70_BTC",
  "HegicStrategy_CALL_100_ETH",
  "HegicStrategy_CALL_110_ETH",
  "HegicStrategy_CALL_120_ETH",
  "HegicStrategy_CALL_130_ETH",
  "HegicStrategy_CALL_100_BTC",
  "HegicStrategy_CALL_110_BTC",
  "HegicStrategy_CALL_120_BTC",
  "HegicStrategy_CALL_130_BTC",
  "HegicStrategy_STRADDLE_ETH",
  "HegicStrategy_STRADDLE_BTC",
  "HegicStrategy_STRANGLE_10_ETH",
  "HegicStrategy_STRANGLE_10_BTC",
  "HegicStrategy_STRANGLE_20_ETH",
  "HegicStrategy_STRANGLE_20_BTC",
  "HegicStrategy_STRANGLE_30_ETH",
  "HegicStrategy_STRANGLE_30_BTC",
  "HegicStrategy_SPREAD_CALL_10_ETH",
  "HegicStrategy_SPREAD_CALL_10_BTC",
  "HegicStrategy_SPREAD_CALL_20_ETH",
  "HegicStrategy_SPREAD_CALL_20_BTC",
  "HegicStrategy_SPREAD_CALL_30_ETH",
  "HegicStrategy_SPREAD_CALL_30_BTC",
  "HegicStrategy_SPREAD_PUT_10_ETH",
  "HegicStrategy_SPREAD_PUT_10_BTC",
  "HegicStrategy_SPREAD_PUT_20_ETH",
  "HegicStrategy_SPREAD_PUT_20_BTC",
  "HegicStrategy_SPREAD_PUT_30_ETH",
  "HegicStrategy_SPREAD_PUT_30_BTC",
  "HegicStrategy_STRAP_ETH",
  "HegicStrategy_STRAP_BTC",
  "HegicStrategy_STRIP_ETH",
  "HegicStrategy_STRIP_BTC",
] as const


export const availableStrategies = [...classicStrategies, ...inverseStrategies] as const 

export type StrategyType =
  | "PUT"
  | "CALL"
  | "INVERSE_BEAR_CALL_SPREAD"
  | "INVERSE_BULL_PUT_SPREAD"
  | "STRADDLE"
  | "STRANGLE"
  | "INVERSE_LONG_BUTTERFLY"
  | "INVERSE_LONG_CONDOR"
  | "SPREAD_CALL"
  | "SPREAD_PUT"
  | "STRAP"
  | "STRIP"
