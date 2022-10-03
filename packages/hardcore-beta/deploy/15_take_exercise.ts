import {HardhatRuntimeEnvironment} from "hardhat/types"
import {BigNumber as BN, utils} from "ethers"

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
    priceCorrection: 10000,
    currency: "ETH",
    type: "CALL",
  }

  const paramsBTC = {
    pool: Pool.address,
    priceProvider: PriceProviderBTC.address,
    spotDecimals: 8,
    priceCorrection: 10000,
    limit: 90000e6,
    currency: "BTC",
    type: "CALL",
  }

  async function deployATM(params: typeof paramsETH) {
    const {type} = params
    const pricerName = `PriceCalculatorATM_${type}_${params.currency}`
    const strategyName = `HegicStrategyATM_${type}_${params.currency}`
    const basePricerName = `BasePriceCalculator_${type}_${params.currency}`
    const basePricer = (await get(basePricerName)).address

    const VECTOR_ONE = [(10n ** 30n).toString(), 0, 0, 0, 0]

    const pricer = await deploy(pricerName, {
      contract: "ScaledPolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: ["10000", "0", basePricer, VECTOR_ONE],
    })

    await execute(
      pricerName,
      {log: true, from: deployer},
      "setPeriodLimits",
      7 * 24 * 3600,
      45 * 24 * 3600,
    )

    const strategy = await deploy(strategyName, {
      contract:
        params.type == "CALL" ? "HegicStrategyCall" : "HegicStrategyPut",
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

  await deployATM({
    ...paramsETH,
    type: "CALL",
  })
  await deployATM({
    ...paramsETH,
    type: "PUT",
  })
  await deployATM({
    ...paramsBTC,
    type: "CALL",
  })
  await deployATM({
    ...paramsBTC,
    type: "PUT",
  })
}

deployment.tags = ["test-single", "single-atm"]
deployment.dependencies = [
  "single-pricer-atm",
  "operational-treasury",
  "options-manager",
  "single-prices",
]

export default deployment
