import {HardhatRuntimeEnvironment} from "hardhat/types"
import { ProfitCalculator } from "../typechain"

async function deployment(hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()

  await deploy("ProfitCalculator",{
    from: deployer,
    log:true
  })

}

deployment.tags = ["test", "profit-calculator"]
export default deployment
