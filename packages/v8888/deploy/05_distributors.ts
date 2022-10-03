import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, ethers} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()

  const HLTPs = await get("HLTPs")
  const WETH = await get("WETH")
  const USDC = await get("USDC")
  const WBTC = await get("WBTC")
  const WETHStaking = await get("WETHStaking")
  const USDCStaking = await get("USDCStaking")
  const WBTCStaking = await get("WBTCStaking")

  const WETHDistributor = await deploy("WETHDistributor", {
    contract: "SettlementFeeDistributor",
    from: deployer,
    log: true,
    args: [WETHStaking.address, WETH.address, HLTPs.address],
  })

  const WBTCDistributor = await deploy("WBTCDistributor", {
    contract: "SettlementFeeDistributor",
    from: deployer,
    log: true,
    args: [WBTCStaking.address, WBTC.address, HLTPs.address],
  })

  const USDCDistributor = await deploy("USDCDistributor", {
    contract: "SettlementFeeDistributor",
    from: deployer,
    log: true,
    args: [USDCStaking.address, USDC.address, HLTPs.address],
  })

  await execute(
    "HegicWETHCALL",
    {from: deployer, log: true},
    "setSettlementFeeRecipient",
    WETHDistributor.address,
  )
  await execute(
    "HegicWETHPUT",
    {from: deployer, log: true},
    "setSettlementFeeRecipient",
    USDCDistributor.address,
  )
  await execute(
    "HegicWBTCCALL",
    {from: deployer, log: true},
    "setSettlementFeeRecipient",
    WBTCDistributor.address,
  )
  await execute(
    "HegicWBTCPUT",
    {from: deployer, log: true},
    "setSettlementFeeRecipient",
    USDCDistributor.address,
  )
}

deployment.tags = ["test", "distributors"]

export default deployment
