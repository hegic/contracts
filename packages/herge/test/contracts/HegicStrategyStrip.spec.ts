import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getStripCallLegPayOff, getStripPutLegPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyStrip.spec", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise Strip when Call Leg is in-the-money zone", () => {
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
        strategies.HegicStrategy_STRIP_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1200", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getStripCallLegPayOff = getStripCallLegPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getStripCallLegPayOff)
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
        strategies.HegicStrategy_STRIP_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("23212", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getStripCallLegPayOff = getStripCallLegPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getStripCallLegPayOff)
    })
  })

  describe("Should correct exercise Strip when Put Leg is in-the-money zone", () => {
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
        strategies.HegicStrategy_STRIP_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("700", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getStripPutLegPayOff = getStripPutLegPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getStripPutLegPayOff)
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
        strategies.HegicStrategy_STRIP_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("16666", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getStripPutLegPayOff = getStripPutLegPayOff(
        atmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getStripPutLegPayOff)
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
        strategies.HegicStrategy_STRIP_ETH.address,
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
        strategies.HegicStrategy_STRIP_BTC.address,
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
