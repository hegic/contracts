import {HardhatRuntimeEnvironment} from "hardhat/types"
import {utils} from "ethers"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()
  const STRATEGY_ROLE = utils.keccak256(utils.toUtf8Bytes("STRATEGY_ROLE"))

  const Pool = await get("HegicOperationalTreasury")
  const PriceProviderETH = await get("PriceProviderETH")
  const PriceProviderBTC = await get("PriceProviderBTC")

  const paramsETH = {
    pool: Pool.address,
    priceProvider: PriceProviderETH.address,
    spotDecimals: 18,
    coefficients: ["-1", "0", "0", "0", "0"],

    roundedDecimals: 0,
    percent: 110,
    limit: 90000e6,
    priceCorrection: 10000,
    currency: "ETH",
  }

  const paramsBTC = {
    pool: Pool.address,
    priceProvider: PriceProviderBTC.address,
    spotDecimals: 8,
    coefficients: ["-1", "0", "0", "0", "0"],
    roundedDecimals: 0,
    percent: 110,
    priceCorrection: 10000,
    limit: 90000e6,
    currency: "BTC",
  }

  async function deployOTM(params: typeof paramsETH) {
    const type = params.percent > 100 ? "CALL" : "PUT"
    const coefficients = params.coefficients

    const pricerName = `PriceCalculatorOTM_${type}_${params.percent}_${params.currency}`
    const strategyName = `HegicStrategyOTM_${type}_${params.percent}_${params.currency}`
    const basePricer = `BasePriceCalculator_${type}_${params.currency}`

    const pricer = await deploy(pricerName, {
      contract: "ScaledPolynomialPriceCalculator",
      from: deployer,
      log: true,
      args: [
        params.percent * 100,
        params.roundedDecimals,
        (await get(basePricer)).address,
        coefficients,
      ],
    })

    await execute(
      pricerName,
      {log: true, from: deployer},
      "setPeriodLimits",
      7 * 24 * 3600,
      60 * 24 * 3600,
    )

    const strategy = await deploy(strategyName, {
      contract: params.percent > 100 ? "HegicStrategyCall" : "HegicStrategyPut",
      from: deployer,
      log: true,
      args: [
        params.pool,
        params.priceProvider,
        pricer.address,
        params.spotDecimals,
        params.limit,
      ],
    })
    await execute(
      "HegicOperationalTreasury",
      {log: true, from: deployer},
      "grantRole",
      STRATEGY_ROLE,
      strategy.address,
    )
  }
  await deployOTM({
    ...paramsETH,
    percent: 70,
    coefficients: [
      "1267889842371270000000000000",
      "131303656858785000000000",
      "-31770759822996300",
      "4199271988",
      "0",
    ],
  })
  await deployOTM({
    ...paramsETH,
    percent: 80,
    coefficients: [
      "-35000738696413000000000000000",
      "275263549045959000000000",
      "-74859976886845200",
      "8488772208",
      "0",
    ],
  })
  await deployOTM({
    ...paramsETH,
    percent: 90,
    coefficients: [
      "74704032287450500000000000000",
      "341843119791027000000000",
      "-95115866625653700",
      "10460125965",
      "0",
    ],
  })
  await deployOTM({
    ...paramsETH,
    percent: 110,
    coefficients: [
      "28584716992845400000000000000",
      "399519662038340000000000",
      "-112001352203303000",
      "12193082267",
      "0",
    ],
  })
  await deployOTM({
    ...paramsETH,
    percent: 120,
    coefficients: [
      "-56797625050193200000000000000",
      "277314504543487000000000",
      "-72382630700894000",
      "8667650992",
      "0",
    ],
  })
  await deployOTM({
    ...paramsETH,
    percent: 130,
    coefficients: [
      "-50747060127632900000000000000",
      "179319173311887000000000",
      "-44615967848709300",
      "5688122073",
      "0",
    ],
  })

  await deployOTM({
    ...paramsBTC,
    percent: 70,
    coefficients: [
      "4284995392275290000000000000",
      "78397464706645800000000",
      "-21794262824247200",
      "2885471476",
      "0",
    ],
  })
  await deployOTM({
    ...paramsBTC,
    percent: 80,
    coefficients: [
      "5124752694006630000000000000",
      "241063328134870000000000",
      "-73791108806383800",
      "8807250086",
      "0",
    ],
  })
  await deployOTM({
    ...paramsBTC,
    percent: 90,
    coefficients: [
      "309419056467218000000000000000",
      "225089343956624000000000",
      "-72777780397377000",
      "8186314578",
      "0",
    ],
  })
  await deployOTM({
    ...paramsBTC,
    percent: 110,
    coefficients: [
      "281940143730995000000000000000",
      "249776104111215000000000",
      "-80809114003500000",
      "9083676074",
      "0",
    ],
  })
  await deployOTM({
    ...paramsBTC,
    percent: 120,
    coefficients: [
      "13151244817854900000000000000",
      "219829718013515000000000",
      "-65660490080178100",
      "8047183598",
      "0",
    ],
  })
  await deployOTM({
    ...paramsBTC,
    percent: 130,
    coefficients: [
      "13186418192640800000000000000",
      "55668109084009700000000",
      "-9248802266955400",
      "2108859611",
      "0",
    ],
  })
}

deployment.tags = ["test-single", "single-otm"]
deployment.dependencies = [
  "single-pricer-atm",
  "operational-treasury",
  "options-manager",
  "single-prices",
]

export default deployment
