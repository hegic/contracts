import {deployments, ethers} from "hardhat"
import {
  PositionsManager,
  PriceProviderMock,
  OperationalTreasury,
  ProfitDistributor,
  PolynomialPriceCalculator,
} from "../../typechain"
import {CoverPool} from "../../typechain/CoverPool"
import {Erc20Mock} from "../../typechain/Erc20Mock"
import {HegicStrategy} from "../../typechain/HegicStrategy"

export const availableStrategies = [
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
  "HegicStrategy_STRADDLE_ETH",
  "HegicStrategy_STRADDLE_BTC",
  "HegicStrategy_STRANGLE_10_ETH",
  "HegicStrategy_STRANGLE_10_BTC",
  "HegicStrategy_STRANGLE_20_ETH",
  "HegicStrategy_STRANGLE_20_BTC",
  "HegicStrategy_STRANGLE_30_ETH",
  "HegicStrategy_STRANGLE_30_BTC",
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

export const availablePricers = [
  "PriceCalculator_PUT_100_ETH",
  "PriceCalculator_PUT_90_ETH",
  "PriceCalculator_PUT_80_ETH",
  "PriceCalculator_PUT_70_ETH",
  "PriceCalculator_PUT_100_BTC",
  "PriceCalculator_PUT_90_BTC",
  "PriceCalculator_PUT_80_BTC",
  "PriceCalculator_PUT_70_BTC",
  "PriceCalculator_CALL_100_ETH",
  "PriceCalculator_CALL_110_ETH",
  "PriceCalculator_CALL_120_ETH",
  "PriceCalculator_CALL_130_ETH",
  "PriceCalculator_CALL_100_BTC",
  "PriceCalculator_CALL_110_BTC",
  "PriceCalculator_CALL_120_BTC",
  "PriceCalculator_CALL_130_BTC",
  "PriceCalculator_INVERSE_BEAR_CALL_SPREAD_10_ETH",
  "PriceCalculator_INVERSE_BEAR_CALL_SPREAD_10_BTC",
  "PriceCalculator_INVERSE_BEAR_CALL_SPREAD_20_ETH",
  "PriceCalculator_INVERSE_BEAR_CALL_SPREAD_20_BTC",
  "PriceCalculator_INVERSE_BEAR_CALL_SPREAD_30_ETH",
  "PriceCalculator_INVERSE_BEAR_CALL_SPREAD_30_BTC",
  "PriceCalculator_INVERSE_BULL_PUT_SPREAD_10_ETH",
  "PriceCalculator_INVERSE_BULL_PUT_SPREAD_10_BTC",
  "PriceCalculator_INVERSE_BULL_PUT_SPREAD_20_ETH",
  "PriceCalculator_INVERSE_BULL_PUT_SPREAD_20_BTC",
  "PriceCalculator_INVERSE_BULL_PUT_SPREAD_30_ETH",
  "PriceCalculator_INVERSE_BULL_PUT_SPREAD_30_BTC",
  "PriceCalculator_STRADDLE_ETH",
  "PriceCalculator_STRADDLE_BTC",
  "PriceCalculator_STRANGLE_10_ETH",
  "PriceCalculator_STRANGLE_10_BTC",
  "PriceCalculator_STRANGLE_20_ETH",
  "PriceCalculator_STRANGLE_20_BTC",
  "PriceCalculator_STRANGLE_30_ETH",
  "PriceCalculator_STRANGLE_30_BTC",
  "PriceCalculator_INVERSE_LONG_BUTTERFLY_10_ETH",
  "PriceCalculator_INVERSE_LONG_BUTTERFLY_10_BTC",
  "PriceCalculator_INVERSE_LONG_BUTTERFLY_20_ETH",
  "PriceCalculator_INVERSE_LONG_BUTTERFLY_20_BTC",
  "PriceCalculator_INVERSE_LONG_BUTTERFLY_30_ETH",
  "PriceCalculator_INVERSE_LONG_BUTTERFLY_30_BTC",
  "PriceCalculator_INVERSE_LONG_CONDOR_20_ETH",
  "PriceCalculator_INVERSE_LONG_CONDOR_20_BTC",
  "PriceCalculator_INVERSE_LONG_CONDOR_30_ETH",
  "PriceCalculator_INVERSE_LONG_CONDOR_30_BTC",
  "PriceCalculator_SPREAD_CALL_10_ETH",
  "PriceCalculator_SPREAD_CALL_10_BTC",
  "PriceCalculator_SPREAD_CALL_20_ETH",
  "PriceCalculator_SPREAD_CALL_20_BTC",
  "PriceCalculator_SPREAD_CALL_30_ETH",
  "PriceCalculator_SPREAD_CALL_30_BTC",
  "PriceCalculator_SPREAD_PUT_10_ETH",
  "PriceCalculator_SPREAD_PUT_10_BTC",
  "PriceCalculator_SPREAD_PUT_20_ETH",
  "PriceCalculator_SPREAD_PUT_20_BTC",
  "PriceCalculator_SPREAD_PUT_30_ETH",
  "PriceCalculator_SPREAD_PUT_30_BTC",
  "PriceCalculator_STRAP_ETH",
  "PriceCalculator_STRAP_BTC",
  "PriceCalculator_STRIP_ETH",
  "PriceCalculator_STRIP_BTC",
] as const

type StrategyName = typeof availableStrategies[number]
type PolynomialPricers = typeof availablePricers[number]

export const fixture = deployments.createFixture<Fixture, string | string[]>(
  async ({deployments}, tags = "test") => {
    await deployments.fixture(tags)
    return await getContracts()
  },
)

export async function getContracts() {
  const signers = await ethers.getSigners()

  const rawStrategies = await Promise.all(
    availableStrategies.map(async (strategyName) => [
      strategyName,
      (await ethers.getContract(strategyName)) as HegicStrategy,
    ]),
  )

  const rawPricers = await Promise.all(
    availablePricers.map(async (PolynomialPricers) => [
      PolynomialPricers,
      (await ethers.getContract(
        PolynomialPricers,
      )) as PolynomialPriceCalculator,
    ]),
  )

  return {
    signers,
    USDC: (await ethers.getContract("USDC")) as Erc20Mock,
    HEGIC: (await ethers.getContract("HEGIC")) as Erc20Mock,
    CoverPool: (await ethers.getContract("CoverPool")) as CoverPool,
    payoffPool: signers[9],
    ProfitDistributor: (await ethers.getContract(
      "ProfitDistributor",
    )) as ProfitDistributor,
    OperationalTreasury: (await ethers.getContract(
      "OperationalTreasury",
    )) as OperationalTreasury,
    PositionsManager: (await ethers.getContract(
      "PositionsManager",
    )) as PositionsManager,
    BasePriceCalculator_PUT_ETH: (await ethers.getContract(
      "PriceCalculator_PUT_100_ETH",
    )) as PolynomialPriceCalculator,
    PriceProviderETH: (await ethers.getContract(
      "PriceProviderETH",
    )) as PriceProviderMock,
    PriceProviderBTC: (await ethers.getContract(
      "PriceProviderBTC",
    )) as PriceProviderMock,
    strategies: Object.fromEntries(rawStrategies) as {
      [key in StrategyName]: HegicStrategy
    },
    pricers: Object.fromEntries(rawPricers) as {
      [key in PolynomialPricers]: PolynomialPriceCalculator
    },
  }
}

export type Fixture = Awaited<ReturnType<typeof getContracts>>
