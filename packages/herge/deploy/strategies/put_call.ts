import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"
import prices from "./.deploy_prices.json"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy, get } = deployments
  const { deployer } = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")

  const _params = {
    limit: parseUnits("10000", 6),
    currency: "",
    type: "",
    priceScale: 0,
  }

  async function deployOptionStrategy(params: typeof _params) {
    

    const priceProvider = await get("PriceProvider" + params.currency)
    const priceScale = params.type == "PUT" ? 100 - params.priceScale : 100 + params.priceScale
    const pricerName = `PriceCalculator_${params.type}_${priceScale}_${params.currency}`
    const strategyName = `HegicStrategy_${params.type}_${priceScale}_${params.currency}`
    const contract = params.type == "PUT" ? "HegicStrategyPut" : "HegicStrategyCall"
    const spotDecimals = {ETH:18, BTC:8}[params.currency]

    const pricer = await deploy(
      pricerName,
      {
        contract: "PolynomialPriceCalculator",
        from: deployer,
        log: true,
        args: [
          prices[strategyName as keyof typeof prices],
          priceProvider.address,
          spotDecimals,
        ],
      },
    )

    await deploy(strategyName, {
      contract,
      from: deployer,
      log: true,
      libraries:{
        ProfitCalculator: ProfitCalculatorLib.address
      },
      args: [
        priceProvider.address,
        pricer.address,
        params.limit,
        spotDecimals,
        priceScale * 100,
      ]
    })
  }

  for (const type of ["PUT", "CALL"])
    for (const currency of ["ETH", "BTC"])
      for (const priceScale of [0, 10, 20, 30]) {
        await deployOptionStrategy({ ..._params, currency, priceScale, type })
      }
}

deployment.tags = ["test", "strategies", "strategy-put-call"]
deployment.dependencies = ["profit-calculator"]
export default deployment