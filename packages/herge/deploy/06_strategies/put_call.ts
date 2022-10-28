import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"
import prices_test from "./.deploy_prices.json"
import prices_arbitrum from "./.deploy_prices_arbitrum.json"
import limits_arbitrum from "./.limits.json"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy, get, execute } = deployments
  const { deployer } = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")

  const _params = {
    default_limit: parseUnits("10000", 6),
    limits:{
        arbitrum: limits_arbitrum
    } as {[key:string]:typeof limits_arbitrum},
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

    const prices = {
      arbitrum: prices_arbitrum
    }[hre.network.name] || prices_test

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
        params.limits?.[strategyName as keyof typeof limits_arbitrum] ?? params.default_limit,
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

deployment.tags = ["test", "strategies", "strategy-put-call", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment