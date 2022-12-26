import {HardhatRuntimeEnvironment} from "hardhat/types"
import config from "./.config"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute } = deployments
  const {deployer} = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")
  const LimitController = await get("LimitController")

  type DeployParams = {
    scale: number
    currency: string
    periodVersion: number
  }

  async function deployOptionStrategy(params: DeployParams) {
    const priceProvider = await get("PriceProvider" + params.currency)
    const pricerName = `PriceCalculator_SPREAD_CALL_${params.scale}_${params.currency}`
    const strategyName = `HegicStrategy_SPREAD_CALL_${params.scale}_${params.currency}_${params.periodVersion}`
    const contract = "HegicStrategySpreadCall"
    const spotDecimals = {ETH: 18, BTC: 8}[params.currency]

    const atmPricer = `PriceCalculator_CALL_100_${params.currency}`
    const otmPricer = `PriceCalculator_CALL_${100 + params.scale}_${
      params.currency
    }`

    const pricers = [
      (await get(atmPricer)).address,
      (await get(otmPricer)).address,
    ]

    const pricer = await deploy(pricerName, {
      contract: "CombinePriceCalculator",
      from: deployer,
      log: true,
      args: [pricers, [1e5, -8e4]],
    })

    const strategyInstance = await deploy(strategyName, {
      contract,
      from: deployer,
      log: true,
      libraries: {
        ProfitCalculator: ProfitCalculatorLib.address,
      },
      args: [
        priceProvider.address,
        pricer.address,
        config[strategyName].limit,
        spotDecimals,
        params.scale * 100,
        config[strategyName].periodLimits,
        config[strategyName].window,
        LimitController.address,
      ],
    })


  }

  for (const scale of [10, 20, 30])
    for (const currency of ["ETH", "BTC"])
      for (const periodVersion of [1, 2, 3, 4])
        await deployOptionStrategy({currency, scale, periodVersion})
}

deployment.tags = ["test", "strategies", "strategy-spread-call", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment
