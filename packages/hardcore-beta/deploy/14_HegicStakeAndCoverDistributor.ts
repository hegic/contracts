import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("HegicStakeAndCoverDistributor", {
    from: deployer,
    log: true,
    args: [(await get("HegicStakeAndCover")).address],
  })
}

deployment.tags = ["test-single", "HegicStakeAndCoverDistributor"]
deployment.dependencies = ["stake-and-cover"]
export default deployment
