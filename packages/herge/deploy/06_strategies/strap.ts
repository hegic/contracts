import {HardhatRuntimeEnvironment} from "hardhat/types"
import {parseUnits} from "ethers/lib/utils"
import limits_arbitrum from "./.limits.json"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer} = await getNamedAccounts()
  const ProfitCalculatorLib = await get("ProfitCalculator")

  const _params = {
    currency: "",
    default_limit: parseUnits("10000", 6),
    limits: {
      arbitrum: limits_arbitrum,
    }[hre.network.name] as typeof limits_arbitrum,
  }

  async function deployOptionStrategy(params: typeof _params) {
    const priceProvider = await get("PriceProvider" + params.currency)
    const pricerName = `PriceCalculator_STRAP_${params.currency}`
    const strategyName = `HegicStrategy_STRAP_${params.currency}`
    const contract = "HegicStrategyStrap"
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
      args: [pricers, [1e5, 2e5]],
    })

    await deploy(strategyName, {
        contract,
        from: deployer,
        log: true,
        libraries: {
            ProfitCalculator: ProfitCalculatorLib.address
        },
        args: [
            priceProvider.address,
            pricer.address,
            params.limits?.[strategyName as keyof typeof limits_arbitrum] ?? params.default_limit,
            spotDecimals
        ]
    })
  }

  for (const currency of ["ETH", "BTC"])
    await deployOptionStrategy({..._params, currency})
}

deployment.tags = ["test", "strategies", "strategy-strap", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment
