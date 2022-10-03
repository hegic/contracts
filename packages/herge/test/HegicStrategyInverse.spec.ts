import {expect} from "chai"
import {fixture, Fixture} from "./utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes, formatUnits} from "ethers/lib/utils"
import {constants, BigNumberish, ethers, BigNumber} from "ethers"
import {initializePools} from "./utils/contracts"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

describe("HegicStrategyInverseBearCallSpread.spec", () => {
  let testData: Fixture

  const show = async (testData: Fixture) =>
    console.log(
      (await testData.OperationalTreasury.totalBalance()).toNumber() / 1e6,
      (await testData.OperationalTreasury.lockedPremium()).toNumber() / 1e6,
      (await testData.OperationalTreasury.totalLocked()).toNumber() / 1e6,
    )

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise Bear-Call-Spread-10% option", () => {
    describe("ETH", () => {
      it("should exercise when an adress has an exerciser role", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        //todo
      })

      it("should revert exercise when an adress has not an exerciser role", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        //todo
      })
    })
  })
})
