import {HardhatRuntimeEnvironment} from "hardhat/types"
import prices_test from "./.deploy_prices.json"
import prices_arbitrum from "./.deploy_prices_arbitrum.json"
import config from "./.config"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")
  const LimitController = await get("LimitController")

  type DeployParams = {
    currency: string
    type: string
    priceScale: number
    periodVersion: number
  }

  async function deployOptionStrategy(params: DeployParams) {
    const priceProvider = await get("PriceProvider" + params.currency)
    const priceScale =
      params.type == "PUT" ? 100 - params.priceScale : 100 + params.priceScale
    const pricerName = `PriceCalculator_${params.type}_${priceScale}_${params.currency}`
    const strategyName = `HegicStrategy_${params.type}_${priceScale}_${params.currency}_${params.periodVersion}`
    const contract =
      params.type == "PUT" ? "HegicStrategyPut" : "HegicStrategyCall"
    const spotDecimals = {ETH: 18, BTC: 8}[params.currency]

    const prices =
      {
        arbitrum: prices_arbitrum,
      }[hre.network.name] || prices_test

    const pricer = await deploy(pricerName, {
      contract: "PolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: [
        prices[pricerName as keyof typeof prices],
        priceProvider.address,
        spotDecimals,
      ],
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
        priceScale * 100,
        config[strategyName].periodLimits,
        config[strategyName].window,
        LimitController.address,
      ],
    })
  }

  for (const type of ["PUT", "CALL"])
    for (const currency of ["ETH", "BTC"])
      for (const priceScale of [0, 10, 20, 30])
        for (const periodVersion of [1, 2, 3, 4]) {
          await deployOptionStrategy({
            currency,
            priceScale,
            type,
            periodVersion,
          })
        }
}

deployment.tags = ["test", "strategies", "strategy-put-call", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment
