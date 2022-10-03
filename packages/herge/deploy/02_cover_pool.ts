import {HardhatRuntimeEnvironment} from "hardhat/types"
import {parseUnits} from "ethers/lib/utils"

export const params = {
  changingPrice: parseUnits(".01",18)
}

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network, getUnnamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer, payoffPool} = await getNamedAccounts()

  const [USDC, HEGIC] = await Promise.all(["USDC", "HEGIC"].map(get))

  await deploy("CoverPool", {
    from: deployer,
    log: true,
    args: [HEGIC.address, USDC.address, payoffPool, params.changingPrice],
  })
}

deployment.tags = ["test", "cover-pool"]
export default deployment
