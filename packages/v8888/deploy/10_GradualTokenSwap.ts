import {HardhatRuntimeEnvironment} from "hardhat/types"

const params = {
  duration: 180 * 24 * 3600, // 180 days
  start: 0, // block.timestamp,
}

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const rHEGIC = await hre.deployments.get("rHEGIC")
  const HEGIC = await hre.deployments.get("HEGIC")
  const {deployer} = await hre.getNamedAccounts()
  await hre.deployments.deploy("GradualTokenSwap", {
    from: deployer,
    log: true,
    args: [params.start, params.duration, rHEGIC.address, HEGIC.address],
  })
}

deployment.tags = ["test", "GTS"]
deployment.dependencies = ["tokens"]

export default deployment
