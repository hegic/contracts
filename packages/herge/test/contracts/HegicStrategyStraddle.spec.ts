import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getCallPayOff, getPutPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyStraddle", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise Staddle when Call Leg is in-the-money zone", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let atmStrike = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1444", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("23212", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })
  })

  describe("Should correct exercise Staddle when Put Leg is in-the-money zone", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let atmStrike = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("555", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("16666", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })
  })

  describe("Should revert payoff when exercise price = atm strike price", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let atmStrike = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = atmStrike
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = atmStrike
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
