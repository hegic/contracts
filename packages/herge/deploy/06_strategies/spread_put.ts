import {HardhatRuntimeEnvironment} from "hardhat/types"
import {parseUnits} from "ethers/lib/utils"
import limits_arbitrum from "./.limits.json"
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
    const pricerName = `PriceCalculator_SPREAD_PUT_${params.scale}_${params.currency}`
    const strategyName = `HegicStrategy_SPREAD_PUT_${params.scale}_${params.currency}_${params.periodVersion}`
    const contract = "HegicStrategySpreadPut"
    const spotDecimals = {ETH: 18, BTC: 8}[params.currency]

    const otmPricer = `PriceCalculator_PUT_${100 - params.scale}_${
      params.currency
    }`
    const atmPricer = `PriceCalculator_PUT_100_${params.currency}`

    const pricers = [
      (await get(otmPricer)).address,
      (await get(atmPricer)).address,
    ]

    const pricer = await deploy(pricerName, {
      contract: "CombinePriceCalculator",
      from: deployer,
      log: true,
      args: [pricers, [-8e4, 1e5]],
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

deployment.tags = ["test", "strategies", "strategy-spread-put", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment
