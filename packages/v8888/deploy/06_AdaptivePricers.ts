import {HardhatRuntimeEnvironment} from "hardhat/types"

const ETHIVRate = "54010000000000" // 680000000000
const BTCIVRate = "46000000000000" // 510000000000

// const ETHIVRate = 7e11
// const BTCIVRate = 5e11

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()

  const BTCPriceProvider = await get("WBTCPriceProvider")
  const ETHPriceProvider = await get("ETHPriceProvider")
  const HegicAtmCall_WETH = await get("HegicWETHCALL")
  const HegicAtmPut_WETH = await get("HegicWETHPUT")
  const HegicAtmCall_WBTC = await get("HegicWBTCCALL")
  const HegicAtmPut_WBTC = await get("HegicWBTCPUT")

  const WETHCALLPricer = await deploy("ETHCallPriceCalculator", {
    contract: "AdaptivePriceCalculator",
    from: deployer,
    log: true,
    args: [
      ETHIVRate,
      10000,
      ETHPriceProvider.address,
      HegicAtmCall_WETH.address,
    ],
  })

  const WETHPUTPricer = await deploy("ETHPutPriceCalculator", {
    contract: "AdaptivePutPriceCalculator",
    from: deployer,
    log: true,
    args: [
      ETHIVRate,
      10000,
      ETHPriceProvider.address,
      HegicAtmPut_WETH.address,
      18,
    ],
  })

  const WBTCCALLPricer = await deploy("BTCCallPriceCalculator", {
    contract: "AdaptivePriceCalculator",
    from: deployer,
    log: true,
    args: [
      BTCIVRate,
      10000,
      BTCPriceProvider.address,
      HegicAtmCall_WBTC.address,
    ],
  })

  const WBTCPUTPricer = await deploy("BTCPutPriceCalculator", {
    contract: "AdaptivePutPriceCalculator",
    from: deployer,
    log: true,
    args: [
      BTCIVRate,
      10000,
      BTCPriceProvider.address,
      HegicAtmPut_WBTC.address,
      8,
    ],
  })

  await execute(
    "HegicWETHCALL",
    {from: deployer, log: true},
    "setPriceCalculator",
    WETHCALLPricer.address,
  )
  await execute(
    "HegicWETHPUT",
    {from: deployer, log: true},
    "setPriceCalculator",
    WETHPUTPricer.address,
  )
  await execute(
    "HegicWBTCCALL",
    {from: deployer, log: true},
    "setPriceCalculator",
    WBTCCALLPricer.address,
  )
  await execute(
    "HegicWBTCPUT",
    {from: deployer, log: true},
    "setPriceCalculator",
    WBTCPUTPricer.address,
  )
}

deployment.tags = ["test", "adaptive-pricers"]

export default deployment

export const deployParams = {ETHIVRate, BTCIVRate}
