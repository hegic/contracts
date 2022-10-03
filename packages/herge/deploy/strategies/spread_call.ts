import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"

async function deployment(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deploy, get } = deployments
    const { deployer } = await getNamedAccounts()
    const ProfitCalculatorLib = await get("ProfitCalculator")

    const _params = {
        scale: 0,
        currency: "",
        limit: parseUnits("10000", 6),
    }

    async function deployOptionStrategy(params: typeof _params) {

        const priceProvider = await get("PriceProvider" + params.currency)
        const pricerName = `PriceCalculator_SPREAD_CALL_${params.scale}_${params.currency}`
        const strategyName = `HegicStrategy_SPREAD_CALL_${params.scale}_${params.currency}`
        const contract = "HegicStrategySpreadCall"
        const spotDecimals = { ETH: 18, BTC: 8 }[params.currency]

        const atmPricer = `PriceCalculator_CALL_100_${params.currency}`
        const otmPricer = `PriceCalculator_CALL_${100 + params.scale}_${params.currency}`

        const pricers = [
            (await get(atmPricer)).address,
            (await get(otmPricer)).address,
        ]

        const pricer = await deploy(pricerName, {
            contract: "CombinePriceCalculator",
            from: deployer,
            log: true,
            args: [pricers, [1e5, -1e5]],
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
                params.limit,
                spotDecimals,
                params.scale * 100
            ]
        })
    }

    for (const scale of [10, 20, 30])
        for (const currency of ["ETH", "BTC"])
            await deployOptionStrategy({ ..._params, currency, scale })

}

deployment.tags = ["test", "strategies", "strategy-spread-call"]
deployment.dependencies = ["profit-calculator"]
export default deployment