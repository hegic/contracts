import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"
import limits_arbitrum from "./.limits.json"

async function deployment(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deploy, get } = deployments
    const { deployer } = await getNamedAccounts()
    const ProfitCalculatorLib = await get("ProfitCalculator")

    const _params = {
        scale: 0,
        currency: "",
        default_limit: parseUnits("10000", 6),
        limits:{
            arbitrum: limits_arbitrum
        }[hre.network.name] as typeof limits_arbitrum,
    }

    async function deployOptionStrategy(params: typeof _params) {

        const priceProvider = await get("PriceProvider" + params.currency)
        const pricerName = `PriceCalculator_SPREAD_PUT_${params.scale}_${params.currency}`
        const strategyName = `HegicStrategy_SPREAD_PUT_${params.scale}_${params.currency}`
        const contract = "HegicStrategySpreadPut"
        const spotDecimals = { ETH: 18, BTC: 8 }[params.currency]

        const otmPricer = `PriceCalculator_PUT_${100 - params.scale}_${params.currency}`
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
                params.scale * 100
            ]
        })
    }

    for (const scale of [10, 20, 30])
        for (const currency of ["ETH", "BTC"])
            await deployOptionStrategy({ ..._params, currency, scale })

}

deployment.tags = ["test", "strategies", "strategy-strap", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment