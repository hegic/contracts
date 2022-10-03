import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("ExerciserTakeProfit", {
    from: deployer,
    log: true,
    args: [
      (await get("OptionsManager")).address,
      [
        (await get("HegicWETHCALL")).address,
        (await get("HegicWBTCCALL")).address,
      ],
      [
        (await get("HegicWETHPUT")).address,
        (await get("HegicWBTCPUT")).address,
      ],
    ],
  })
}

deployment.tags = ["test", "ETP"]
// deployment.dependencies = ["base"]

export default deployment
