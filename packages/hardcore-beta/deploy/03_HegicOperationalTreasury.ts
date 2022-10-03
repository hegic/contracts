import {HardhatRuntimeEnvironment} from "hardhat/types"
import {utils} from "ethers"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()
  const HEGIC_POOL_ROLE = utils.keccak256(utils.toUtf8Bytes("HEGIC_POOL_ROLE"))

  const USDC = await get("USDC")
  const HegicStakeAndCover = await get("HegicStakeAndCover")
  const optionsManger = await get("OptionsManager")

  const params = {
    token: USDC.address,
    manager: optionsManger.address,
    maxReservation: 3600 * 24 * 45,
    insurance: HegicStakeAndCover.address,
    benchmark: utils.parseUnits("100000", 6),
    inverseBenchmark: utils.parseUnits("50000", 6),
  }

  const pool = await deploy("HegicOperationalTreasury", {
    from: deployer,
    log: true,
    args: [
      params.token,
      params.manager,
      params.maxReservation,
      params.insurance,
      params.benchmark,
    ],
  })

  await execute(
    "OptionsManager",
    {log: true, from: deployer},
    "grantRole",
    HEGIC_POOL_ROLE,
    pool.address,
  )

  await execute(
    "HegicStakeAndCover",
    {log: true, from: deployer},
    "grantRole",
    HEGIC_POOL_ROLE,
    pool.address,
  )

  const poolInvers = await deploy("HegicInverseOperationalTreasury", {
    from: deployer,
    log: true,
    args: [
      params.token,
      params.manager,
      params.maxReservation,
      params.insurance,
      params.inverseBenchmark,
    ],
  })

  await execute(
    "OptionsManager",
    {log: true, from: deployer},
    "grantRole",
    HEGIC_POOL_ROLE,
    poolInvers.address,
  )

  await execute(
    "HegicStakeAndCover",
    {log: true, from: deployer},
    "grantRole",
    HEGIC_POOL_ROLE,
    poolInvers.address,
  )
}

deployment.tags = ["test-single", "operational-treasury"]
deployment.dependencies = [
  "single-tokens",
  "options-manager",
  "stake-and-cover",
]

export default deployment
