import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"

async function deployment(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deploy, get } = deployments
    const { deployer } = await getNamedAccounts()
    const ProfitCalculatorLib = await get("ProfitCalculator")

    const _params = {
        currency: "",
        limit: parseUnits("10000", 6),
        priceCoefficients: [6e4, -6e4],
        percent: 0
    }

    async function deployOptionStrategy(params: typeof _params) {

        const priceProvider = await get("PriceProvider" + params.currency)
        const contract = "HegicStrategyInverseBearCallSpread"
        const pricerName = `PriceCalculator_INVERSE_BEAR_CALL_SPREAD_${params.percent}_${params.currency}`
        const strategyName = `HegicStrategy_INVERSE_BEAR_CALL_SPREAD_${params.percent}_${params.currency}`
        const spotDecimals = { ETH: 18, BTC: 8 }[params.currency]
    
        const atmPricer = `PriceCalculator_CALL_100_${params.currency}`
        const otmPricer = `PriceCalculator_CALL_${100 + params.percent}_${params.currency}`
    
        const pricers = [
          (await get(atmPricer)).address,
          (await get(otmPricer)).address,
        ]
    
        const pricer = await get(pricerName).catch(() =>
          deploy(pricerName, {
            contract: "CombinePriceCalculator",
            from: deployer,
            log: true,
            args: [pricers, _params.priceCoefficients],
          }),
        )

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
                100 + params.percent
            ]
        })
    }

    for (const percent of [10, 20, 30])
        for (const currency of ["ETH", "BTC"])
            await deployOptionStrategy({ ..._params, currency, percent })

}

deployment.tags = ["test", "strategies", "strategy-inverse-bear-call-spread"]
deployment.dependencies = ["profit-calculator", "strategy-put-call"]
export default deployment