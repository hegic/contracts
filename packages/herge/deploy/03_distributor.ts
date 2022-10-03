import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network, getUnnamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer} = await getNamedAccounts()

  const [USDC] = await Promise.all(["USDC"].map(get))

  await deploy("ProfitDistributor", {
    from: deployer,
    log: true,
    args: [USDC.address],
  })
}

deployment.tags = ["test", "distributor"]
export default deployment
