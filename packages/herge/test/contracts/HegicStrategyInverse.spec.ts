import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes} from "ethers/lib/utils"
import {initializePools} from "../utils/contracts"
import {getBearCallSpreadPayoff} from "../utils/helpers"
import {timeAndMine} from "hardhat"

const EXERCISER_ROLE = keccak256(toUtf8Bytes("EXERCISER_ROLE"))

describe("HegicStrategyInverseBearCallSpread.spec", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise Bear-Call-Spread-10% option", () => {
    it("should revert unlock before the expiration date", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

      await PriceProviderETH.setPrice(sellAtmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )

      await expect(
        OperationalTreasury.connect(alice).unlock(0),
      ).to.be.revertedWith("The expiration time has not yet come")
    })

    it("should revert exercise when address hasn't the EXERCISER_ROLE", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

      await PriceProviderETH.setPrice(sellAtmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1051", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("should unlock option when period is passed", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, ,],
        strategies,
        PriceProviderETH,
        USDC,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

      await PriceProviderETH.setPrice(sellAtmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      let newPrice = parseUnits("10000", 8) //strike which the user sells
      await PriceProviderETH.setPrice(newPrice)

      await timeAndMine.setTimeIncrease("8d")

      await expect(() =>
        OperationalTreasury.connect(deployer).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, parseUnits("100", 6))
    })

    it("should unlock option when period is passed [ADMIN]", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob],
        strategies,
        PriceProviderETH,
        USDC,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

      await PriceProviderETH.setPrice(sellAtmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      await timeAndMine.setTimeIncrease("8d")

      await expect(() =>
        OperationalTreasury.connect(bob).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, parseUnits("100", 6))
    })

    it("should exercise when address has the EXERCISER_ROLE", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells
      let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)

      await PriceProviderETH.setPrice(sellAtmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1051", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      await strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.grantRole(
        EXERCISER_ROLE,
        alice.address,
      ) //grant EXERICSER_ROLE to the Alice

      const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
        buyOtmStrike,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
    })

    it("should revert grantRole transcation when caller hasn't enough rights", async () => {
      const {
        signers: [, alice, ,],
        strategies,
      } = testData

      await expect(
        strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.connect(
          alice,
        ).grantRole(EXERCISER_ROLE, alice.address),
      ).to.be.reverted
    })
  })
})
