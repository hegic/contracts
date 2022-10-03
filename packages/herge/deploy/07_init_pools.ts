import {HardhatRuntimeEnvironment} from "hardhat/types"
import {parseUnits, keccak256, toUtf8Bytes} from "ethers/lib/utils"
import {constants} from "ethers"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
    toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)
const HEGIC_POOL_ROLE = keccak256(
    toUtf8Bytes("HEGIC_POOL_ROLE"),
)

async function deployment(hre: HardhatRuntimeEnvironment) {

  const {deployments, getNamedAccounts, getUnnamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer, payoffPool} = await getNamedAccounts()
  const [alice, bob, carl] = await getUnnamedAccounts()

  const CoverPool = await get("CoverPool")
  const OperationalTreasury = await get("OperationalTreasury")

  await deploy("ProfitCalculator", {
    from: deployer,
    log: true,
  })


  await execute("CoverPool", {from: deployer}, "grantRole", OPERATIONAL_TRESUARY_ROLE, OperationalTreasury.address)
  await execute("OptionsManager", {from: deployer}, "grantRole", HEGIC_POOL_ROLE, OperationalTreasury.address)

  await execute("USDC", {from: deployer}, "mint", OperationalTreasury.address, parseUnits("100000", 6))
  await execute("OperationalTreasury", {from: deployer}, "addTokens")

  await execute("USDC", {from: deployer}, "mint", payoffPool, parseUnits("1000000"))
  await execute("HEGIC", {from: payoffPool}, "approve", CoverPool.address, constants.MaxUint256)

  await execute("HEGIC", {from: deployer}, "mint", carl, parseUnits("1000000000000"))
  await execute("HEGIC", {from: deployer}, "mint", bob, parseUnits("100000"))
  await execute("HEGIC", {from: carl}, "approve", CoverPool.address, constants.MaxUint256)
  await execute("HEGIC", {from: bob}, "approve", CoverPool.address, constants.MaxUint256)
  await execute("CoverPool", {from: carl}, "provide", parseUnits("1000000000000"), 0)
  await execute("CoverPool", {from: bob}, "provide", parseUnits("100000"), 0)
  
  await execute("USDC", {from: deployer}, "mint", alice, parseUnits("10000000000000"))
  await execute("USDC", {from: alice}, "approve", OperationalTreasury.address, constants.MaxUint256)
}

deployment.tags = ["init pools"]
deployment.dependencies = [
    "OperationalTreasury"
  ]
export default deployment
