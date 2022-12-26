import {HardhatRuntimeEnvironment} from "hardhat/types"
import config from "./.config"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")
  const LimitController = await get("LimitController")

  type DeployParams = {
    currency: string
    percent: number
  }

  async function deployOptionStrategy(params: DeployParams) {
    const priceProvider = await get("PriceProvider" + params.currency)
    const contract = "HegicStrategyInverseLongButterfly"
    const pricerName = `PriceCalculator_INVERSE_LONG_BUTTERFLY_${params.percent}_${params.currency}`
    const strategyName = `HegicStrategy_INVERSE_LONG_BUTTERFLY_${params.percent}_${params.currency}`
    const spotDecimals = {ETH: 18, BTC: 8}[params.currency]

    const straddlePricer = `PriceCalculator_STRADDLE_${params.currency}`
    const stranglePricer = `PriceCalculator_STRANGLE_${params.percent}_${params.currency}`

    const pricers = [
      (await get(straddlePricer)).address,
      (await get(stranglePricer)).address,
    ]

    const pricer = await deploy(pricerName, {
      contract: "CombinePriceCalculator",
      from: deployer,
      log: true,
      args: [pricers, [6e4, -6e4]],
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
        params.percent,
        config[strategyName].periodLimits,
        LimitController.address,
      ],
    })


  }

  for (const percent of [10, 20, 30])
    for (const currency of ["ETH", "BTC"])
      await deployOptionStrategy({currency, percent})
}

deployment.tags = [
  "test",
  "strategies",
  "strategy-inverse-long-butterfly",
  "arbitrum",
]
deployment.dependencies = [
  "profit-calculator",
  "strategy-straddle",
  "strategy-strangle",
]
export default deployment
