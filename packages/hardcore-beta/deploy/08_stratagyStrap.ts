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
    limit: 90000e6,
    currency: "ETH",
  }

  const paramsBTC = {
    pool: Pool.address,
    priceProvider: PriceProviderBTC.address,
    spotDecimals: 8,
    limit: 90000e6,
    currency: "BTC",
  }

  async function deploySTRAP(params: typeof paramsETH) {
    const pricerName = `PriceCalculatorSTRAP_${params.currency}`
    const strategyName = `HegicStrategySTRAP_${params.currency}`
    const putPricer = `BasePriceCalculator_PUT_${params.currency}`
    const callPricer = `BasePriceCalculator_CALL_${params.currency}`

    const pricers = [
      (await get(putPricer)).address,
      (await get(callPricer)).address,
    ]

    const pricer = await deploy(pricerName, {
      contract: "CombinePriceCalculator",
      from: deployer,
      log: true,
      args: [pricers, [1e5, 2e5]],
    })

    await execute(
      pricerName,
      {log: true, from: deployer},
      "setPeriodLimits",
      7 * 24 * 3600,
      45 * 24 * 3600,
    )

    const strategy = await deploy(strategyName, {
      contract: "HegicStrategyStrap",
      from: deployer,
      log: true,
      args: [
        params.pool,
        params.priceProvider,
        pricer.address,
        params.spotDecimals,
        params.limit,
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

  await deploySTRAP({
    ...paramsETH,
  })

  await deploySTRAP({
    ...paramsBTC,
  })
}

deployment.tags = ["test-single", "single-strap"]
deployment.dependencies = [
  "single-atm",
  "operational-treasury",
  "options-manager",
  "single-prices",
]

export default deployment
