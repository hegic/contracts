import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, execute} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("ProfitCalculator", {
    from: deployer,
    log: true,
  })

  await deploy("LimitController", {
    from: deployer,
    log: true,
  })
}

deployment.tags = ["test", "profit-calculator", "arbitrum"]
export default deployment
