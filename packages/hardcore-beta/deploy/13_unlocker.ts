import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("Unlocker", {
    from: deployer,
    log: true,
  })
}

deployment.tags = ["test-single", "single-unlocker"]

export default deployment
