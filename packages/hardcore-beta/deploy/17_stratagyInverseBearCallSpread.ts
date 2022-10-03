import {HardhatRuntimeEnvironment} from "hardhat/types"
import {utils} from "ethers"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()
  const STRATEGY_ROLE = utils.keccak256(utils.toUtf8Bytes("STRATEGY_ROLE"))
  const EXERCISER_ROLE = utils.keccak256(utils.toUtf8Bytes("EXERCISER_ROLE"))

  const Pool = await get("HegicInverseOperationalTreasury")
  const PriceProviderETH = await get("PriceProviderETH")
  const PriceProviderBTC = await get("PriceProviderBTC")

  const paramsETH = {
    pool: Pool.address,
    priceProvider: PriceProviderETH.address,
    spotDecimals: 18,
    limit: 1666e6,
    percent: 110,
    roundedDecimals: 0,
    currency: "ETH",
  }

  const paramsBTC = {
    pool: Pool.address,
    priceProvider: PriceProviderBTC.address,
    spotDecimals: 8,
    limit: 1666e6,
    percent: 110,
    roundedDecimals: 0,
    currency: "BTC",
  }

  const priceCoefficients = {
    hardhat: [8e4, -1e5],
    arbitrum: [6e4, -6e4],
  }[hre.network.name] || [8e4, -8e4]

  async function deployInversBEAR_CALL_SPREAD(params: typeof paramsETH) {
    const pricerName = `PriceCalculatorInverseBEAR_CALL_SPREAD_${params.percent}_${params.currency}`
    const strategyName = `HegicStrategyInverseBEAR_CALL_SPREAD_${params.percent}_${params.currency}`

    const atmPricer = `PriceCalculatorATM_CALL_${params.currency}`
    const otmPricer = `PriceCalculatorOTM_CALL_${params.percent}_${params.currency}`

    const pricers = [
      (await get(atmPricer)).address,
      (await get(otmPricer)).address,
    ]

    const pricer = await get(pricerName).catch(() =>
      deploy(pricerName, {
        contract: "CombinePriceCalculator",
        from: deployer,
        log: true,
        args: [pricers, priceCoefficients],
      }),
    )

    await execute(
      pricerName,
      {log: true, from: deployer},
      "setPeriodLimits",
      7 * 24 * 3600,
      30 * 24 * 3600,
    )

    const strategy = await deploy(strategyName, {
      contract: "HegicStrategyInverseBearCallSpread",
      from: deployer,
      log: true,
      args: [
        params.pool,
        params.priceProvider,
        pricer.address,
        params.spotDecimals,
        params.limit,
        params.percent,
        params.roundedDecimals,
      ],
    })
    await execute(
      "HegicInverseOperationalTreasury",
      {log: true, from: deployer},
      "grantRole",
      STRATEGY_ROLE,
      strategy.address,
    )
    await execute(
      strategyName,
      {log: true, from: deployer},
      "grantRole",
      EXERCISER_ROLE,
      "0x139C97005A6AdF38934D5Ee487CC40dd1E8B4Acf",
    )
  }

  for (let params of [paramsBTC, paramsETH])
    for (let percent of [110, 120, 130])
      await deployInversBEAR_CALL_SPREAD({...params, percent})
}

deployment.tags = ["test-single", "single-bear_call_spread"]
deployment.dependencies = [
  "single-atm",
  "single-otm",
  "operational-treasury",
  "options-manager",
  "single-prices",
]

export default deployment
