import {HardhatRuntimeEnvironment} from "hardhat/types"
import {parseUnits} from "ethers/lib/utils"

export const params = {
  changingPrice: {
    arbitrum: parseUnits(".0083", 18),
    default: parseUnits(".01", 18)
  },
}

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer, payoffPool} = await getNamedAccounts()

  const [USDC, HEGIC] = await Promise.all(["USDC", "HEGIC"].map(get))

  const changingPrice = params.changingPrice[hre.network.name as "arbitrum"] || params.changingPrice.default

  await deploy("CoverPool", {
    from: deployer,
    log: true,
    args: [HEGIC.address, USDC.address, payoffPool, changingPrice],
  })
}

deployment.tags = ["test", "cover-pool", "arbitrum"]
export default deployment
