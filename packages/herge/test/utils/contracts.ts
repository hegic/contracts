import {Fixture} from "./fixtures"
import {keccak256, parseUnits, toUtf8Bytes} from "ethers/lib/utils"
import {constants} from "ethers"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

export async function initializePools({
  PositionsManager,
  OperationalTreasury,
  HEGIC,
  CoverPool,
  USDC,
  payoffPool,
  signers: [deployer, alice, bob, carl],
}: Fixture) {
  await HEGIC.mint(carl.address, parseUnits("1000000000000"))
  await HEGIC.connect(carl).approve(CoverPool.address, constants.MaxUint256)

  await HEGIC.mint(bob.address, parseUnits("100000"))
  await HEGIC.connect(bob).approve(CoverPool.address, constants.MaxUint256)

  await USDC.mint(payoffPool.address, parseUnits("1000000"))
  await USDC.connect(payoffPool).approve(
    CoverPool.address,
    parseUnits("1000000"),
  )
  await CoverPool.grantRole(OPERATIONAL_TRESUARY_ROLE, deployer.address)

  await USDC.mint(alice.address, 100000e6)
  await HEGIC.mint(deployer.address, parseUnits("1"))
  await HEGIC.connect(deployer).approve(CoverPool.address, constants.MaxUint256)
  await CoverPool.connect(deployer).provide(parseUnits("1"), 0)
  await CoverPool.connect(carl).provide(parseUnits("1000000000000"), 0)
  await CoverPool.connect(bob).provide(parseUnits("49"), 0)

  await CoverPool.grantRole(
    OPERATIONAL_TRESUARY_ROLE,
    OperationalTreasury.address,
  )

  await PositionsManager.grantRole(
    await PositionsManager.HEGIC_POOL_ROLE(),
    OperationalTreasury.address,
  )

  await USDC.mint(OperationalTreasury.address, 100000e6)
  await USDC.mint(alice.address, parseUnits("10000000000000"))

  let benchmark = 100000e6
  await OperationalTreasury.connect(deployer).setBenchmark(benchmark)

  await USDC.connect(alice).approve(
    OperationalTreasury.address,
    parseUnits("10000000000000"),
  )
}
