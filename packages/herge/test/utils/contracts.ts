import {Fixture} from "./fixtures"
import {keccak256, parseUnits, toUtf8Bytes} from "ethers/lib/utils"
import {BigNumberish, constants} from "ethers"
import yaml from "yaml"
import fs from "fs"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

export async function initializePools({
  OptionsManager,
  OperationalTreasury,
  HEGIC,
  CoverPool,
  USDC,
  payoffPool,
  signers: [deployer, alice, bob, carl],
  pricers,
}: Fixture) {
  //Pricers

  //Cover Pool
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
  await CoverPool.connect(carl).provide(parseUnits("1000000000000"), 0)
  await CoverPool.connect(bob).provide(parseUnits("50"), 0)

  await CoverPool.grantRole(
    OPERATIONAL_TRESUARY_ROLE,
    OperationalTreasury.address,
  )

  //todo transfer to deploy
  await OptionsManager.grantRole(
    await OptionsManager.HEGIC_POOL_ROLE(),
    OperationalTreasury.address,
  )

  //Operational
  await USDC.mint(OperationalTreasury.address, 100000e6)
  await OperationalTreasury.addTokens()
  await USDC.mint(alice.address, parseUnits("10000000000000"))

  let benchmark = 100000e6
  await OperationalTreasury.connect(deployer).setBenchmark(benchmark)

  await USDC.connect(alice).approve(
    OperationalTreasury.address,
    parseUnits("10000000000000"),
  )
}
