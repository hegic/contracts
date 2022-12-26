import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"
import config from "./06_strategies/.config"


async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts } = hre
  const { deploy, get, all } = deployments
  const { deployer } = await getNamedAccounts()
  const mget = async (x:string) => {
    console.log(x)
    return await get(x)
  }

  console.log(await all().then(Object.keys))

  const params = {
    token: (await get("USDC")).address,
    manager: (await get("PositionsManager")).address,
    maxLockupPeriod: 90 * 24 * 3600, // 90 days
    coverPool: (await get("CoverPool")).address,
    benchmark: parseUnits("10000", 6),
    strategies: await Promise.all(Object.keys(config).map(x => mget(x).then(x => x.address)))
  }

  await deploy("OperationalTreasury", {
    from: deployer,
    log: true,
    args: [
      params.token,
      params.manager,
      params.maxLockupPeriod,
      params.coverPool,
      params.benchmark,
      params.strategies
    ]
  })
}

deployment.tags = ["test", "operational-treasury", "arbitrum"]
deployment.dependencies = [
  "strategies"
]

export default deployment
