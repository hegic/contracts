import {HardhatRuntimeEnvironment} from "hardhat/types"

const ETHIVRate = 540000000000
const BTCIVRate = 430000000000

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()

  const hegicPutPools = [
    (await get("HegicWETHPUT")).address,
    (await get("HegicWBTCPUT")).address,
  ]

  const HegicCouponPool = await deploy("HegicCouponPool", {
    from: deployer,
    log: true,
    args: [(await get("USDC")).address, hegicPutPools],
  })
}

deployment.tags = ["HCP"]
deployment.dependencies = ["base", "tokens"]

export default deployment
