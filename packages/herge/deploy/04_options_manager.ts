import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network, getUnnamedAccounts} = hre
  const {deploy} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("OptionsManager", {
    from: deployer,
    log: true,
  })
}

deployment.tags = ["test", "options-manager"]
export default deployment