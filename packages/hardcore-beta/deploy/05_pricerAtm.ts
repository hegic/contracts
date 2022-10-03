import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()

  const PriceProviderETH = await get("PriceProviderETH")
  const PriceProviderBTC = await get("PriceProviderBTC")

  const paramsETH = {
    priceProvider: PriceProviderETH.address,
    spotDecimals: 18,
    coefficientsCall: [
      "91400000000000010993538951020544",
      "89699999999999992643190784",
      "-13300000000000000000",
      "1140000000000",
      "0",
    ],
    coefficientsPut: [
      "108999999999999997382349503332352",
      "79300000000000010427039744",
      "-5710000000000000000",
      "0",
      "0",
    ],
  }

  const paramsBTC = {
    priceProvider: PriceProviderBTC.address,
    spotDecimals: 8,
    coefficientsCall: [
      "958000000000000030871419617280000",
      "941999999999999972384702464",
      "-139000000000000016384",
      "12000000000000",
      "0",
    ],
    coefficientsPut: [
      "1102000000000000047245604476157952",
      "800000000000000038117834752",
      "-57400000000000000000",
      "0",
      "0",
    ],
  }

  const BasePriceCalculator_PUT_ETH = await deploy(
    "BasePriceCalculator_PUT_ETH",
    {
      contract: "PolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: [
        paramsETH.coefficientsPut,
        paramsETH.priceProvider,
        paramsETH.spotDecimals,
      ],
    },
  )

  await execute(
    "BasePriceCalculator_PUT_ETH",
    {log: true, from: deployer},
    "setPeriodLimits",
    1 * 24 * 3600,
    90 * 24 * 3600,
  )

  const BasePriceCalculator_CALL_ETH = await deploy(
    "BasePriceCalculator_CALL_ETH",
    {
      contract: "PolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: [
        paramsETH.coefficientsCall,
        paramsETH.priceProvider,
        paramsETH.spotDecimals,
      ],
    },
  )

  await execute(
    "BasePriceCalculator_CALL_ETH",
    {log: true, from: deployer},
    "setPeriodLimits",
    1 * 24 * 3600,
    90 * 24 * 3600,
  )

  const BasePriceCalculator_PUT_BTC = await deploy(
    "BasePriceCalculator_PUT_BTC",
    {
      contract: "PolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: [
        paramsBTC.coefficientsPut,
        paramsBTC.priceProvider,
        paramsBTC.spotDecimals,
      ],
    },
  )

  await execute(
    "BasePriceCalculator_PUT_BTC",
    {log: true, from: deployer},
    "setPeriodLimits",
    1 * 24 * 3600,
    90 * 24 * 3600,
  )

  const BasePriceCalculator_CALL_BTC = await deploy(
    "BasePriceCalculator_CALL_BTC",
    {
      contract: "PolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: [
        paramsBTC.coefficientsCall,
        paramsBTC.priceProvider,
        paramsBTC.spotDecimals,
      ],
    },
  )

  await execute(
    "BasePriceCalculator_CALL_BTC",
    {log: true, from: deployer},
    "setPeriodLimits",
    1 * 24 * 3600,
    90 * 24 * 3600,
  )
}

deployment.tags = ["test-single", "single-pricer-atm"]
deployment.dependencies = [
  "operational-treasury",
  "options-manager",
  "single-prices",
]

export default deployment
