import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network, getUnnamedAccounts} = hre
  const {deploy} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("PositionsManager", {
    from: deployer,
    log: true,
  })
}

deployment.tags = ["test", "positions-manager"]
export default deployment