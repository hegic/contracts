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
    priceCoefficients: [6e4, -6e4],
    percent: 0,
    default_limit: parseUnits("10000", 6),
    limits: {
      arbitrum: limits_arbitrum,
    }[hre.network.name] as typeof limits_arbitrum,
  }

  async function deployOptionStrategy(params: typeof _params) {
    const priceProvider = await get("PriceProvider" + params.currency)
    const contract = "HegicStrategyInverseBearCallSpread"
    const pricerName = `PriceCalculator_INVERSE_BEAR_CALL_SPREAD_${params.percent}_${params.currency}`
    const strategyName = `HegicStrategy_INVERSE_BEAR_CALL_SPREAD_${params.percent}_${params.currency}`
    const spotDecimals = {ETH: 18, BTC: 8}[params.currency]

    const atmPricer = `PriceCalculator_CALL_100_${params.currency}`
    const otmPricer = `PriceCalculator_CALL_${100 + params.percent}_${
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
      args: [pricers, _params.priceCoefficients],
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
            spotDecimals,
            100 + params.percent
        ]
    })
  }

  for (const percent of [10, 20, 30])
    for (const currency of ["ETH", "BTC"])
      await deployOptionStrategy({..._params, currency, percent})
}

deployment.tags = [
  "test",
  "strategies",
  "strategy-inverse-bear-call-spread",
  "arbitrum",
]
deployment.dependencies = ["profit-calculator", "strategy-put-call"]
export default deployment
