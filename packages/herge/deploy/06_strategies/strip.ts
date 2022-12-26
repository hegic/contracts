import {HardhatRuntimeEnvironment} from "hardhat/types"
import config from "./.config"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute } = deployments
  const {deployer} = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")
  const LimitController = await get("LimitController")

  type DeployParams = {
    currency: string
    periodVersion: number
  }

  async function deployOptionStrategy(params: DeployParams) {
    const priceProvider = await get("PriceProvider" + params.currency)
    const pricerName = `PriceCalculator_STRIP_${params.currency}`
    const strategyName = `HegicStrategy_STRIP_${params.currency}_${params.periodVersion}`
    const contract = "HegicStrategyStrip"
    const spotDecimals = {ETH: 18, BTC: 8}[params.currency]

    const putPricer = `PriceCalculator_PUT_100_${params.currency}`
    const callPricer = `PriceCalculator_CALL_100_${params.currency}`

    const pricers = [
      (await get(putPricer)).address,
      (await get(callPricer)).address,
    ]

    const pricer = await deploy(pricerName, {
      contract: "CombinePriceCalculator",
      from: deployer,
      log: true,
      args: [pricers, [2e5, 1e5]],
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
        config[strategyName].periodLimits,
        config[strategyName].window,
        LimitController.address,
      ],
    })


  }

  for (const currency of ["ETH", "BTC"])
    for (const periodVersion of [1, 2, 3, 4])
      await deployOptionStrategy({currency, periodVersion})
}

deployment.tags = ["test", "strategies", "strategy-strip", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment
