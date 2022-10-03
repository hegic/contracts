import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy} = deployments
  const {deployer} = await getNamedAccounts()

  const OptionsManager = await deploy("OptionsManager", {
    from: deployer,
    log: true,
  })
}

deployment.tags = ["test-single", "options-manager"]
export default deployment
