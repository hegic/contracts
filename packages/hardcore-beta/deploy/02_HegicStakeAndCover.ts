import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer} = await getNamedAccounts()

  const USDC = await get("USDC")
  const HEGIC = await get("HEGIC")

  await deploy("HegicStakeAndCover", {
    from: deployer,
    log: true,
    args: [HEGIC.address, USDC.address],
  })
}

deployment.tags = ["test-single", "stake-and-cover"]
deployment.dependencies = ["single-tokens"]

export default deployment
