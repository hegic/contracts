import {HardhatRuntimeEnvironment} from "hardhat/types"
import {utils} from "ethers"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()
  const STRATEGY_ROLE = utils.keccak256(utils.toUtf8Bytes("STRATEGY_ROLE"))

  const Pool = await get("HegicOperationalTreasury")
  const PriceProviderETH = await get("PriceProviderETH")
  const PriceProviderBTC = await get("PriceProviderBTC")

  const paramsETH = {
    pool: Pool.address,
    priceProvider: PriceProviderETH.address,
    spotDecimals: 18,
    limit: 33333e6,
    percent: 100,
    roundedDecimals: 0,
    currency: "ETH",
  }

  const paramsBTC = {
    pool: Pool.address,
    priceProvider: PriceProviderBTC.address,
    spotDecimals: 8,
    limit: 33333e6,
    percent: 100,
    roundedDecimals: 0,
    currency: "BTC",
  }

  async function deploySPREAD(params: typeof paramsETH) {
    const type = params.percent > 100 ? "CALL" : "PUT"
    const pricerName = `PriceCalculatorSPREAD_${type}_${params.percent}_${params.currency}`
    const strategyName = `HegicStrategySPREAD_${type}_${params.percent}_${params.currency}`

    const atmPricer = `BasePriceCalculator_${type}_${params.currency}`
    const otmPricer = `PriceCalculatorOTM_${type}_${params.percent}_${params.currency}`

    const pricers = [
      (await get(atmPricer)).address,
      (await get(otmPricer)).address,
    ]

    const pricer = await get(pricerName).catch(() =>
      deploy(pricerName, {
        contract: "CombinePriceCalculator",
        from: deployer,
        log: true,
        args: [pricers, [1e5, -8e4]],
      }),
    )

    await execute(
      pricerName,
      {log: true, from: deployer},
      "setPeriodLimits",
      7 * 24 * 3600,
      45 * 24 * 3600,
    )

    const strategy = await deploy(strategyName, {
      contract:
        params.percent > 100
          ? "HegicStrategySpreadCall"
          : "HegicStrategySpreadPut",
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
      "HegicOperationalTreasury",
      {log: true, from: deployer},
      "grantRole",
      STRATEGY_ROLE,
      strategy.address,
    )
  }

  for (let params of [paramsBTC, paramsETH])
    for (let percent of [70, 80, 90, 110, 120, 130])
      await deploySPREAD({...params, percent})
}

deployment.tags = ["test-single", "single-spread"]
deployment.dependencies = [
  "single-otm",
  "operational-treasury",
  "options-manager",
  "single-prices",
]

export default deployment
