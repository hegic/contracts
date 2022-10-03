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
        const contract = "HegicStrategyInverseLongCondor"
        const pricerName = `PriceCalculator_INVERSE_LONG_CONDOR_${params.percent}_${params.currency}`
        const strategyName = `HegicStrategy_INVERSE_LONG_CONDOR_${params.percent}_${params.currency}`
        const spotDecimals = { ETH: 18, BTC: 8 }[params.currency]
    

        const strangle10Pricer = `PriceCalculator_STRANGLE_10_${params.currency}`
        const stranglePricer = `PriceCalculator_STRANGLE_${params.percent}_${params.currency}`
    
        const pricers = [
          (await get(strangle10Pricer)).address,
          (await get(stranglePricer)).address,
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
                params.percent
            ]
        })
    }

    for (const percent of [20, 30])
        for (const currency of ["ETH", "BTC"])
            await deployOptionStrategy({ ..._params, currency, percent })

}

deployment.tags = ["test", "strategies", "strategy-inverse-long-condor"]
deployment.dependencies = ["profit-calculator", "strategy-strangle"]
export default deployment