import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getCallPayOff, getPutPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyStrangle.spec", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise Strangle-10% when Call Leg is in-the-money zone", () => {
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
      let spotPrice = parseUnits("1000", 8)
      let otmStrike = parseUnits("1100", 8)

      await PriceProviderETH.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1444", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        otmStrike,
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
      let spotPrice = parseUnits("20000", 8)
      let otmStrike = parseUnits("22000", 8)

      await PriceProviderBTC.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("23212", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        otmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })
  })

  describe("Should correct exercise Strangle-10% when Put Leg is in-the-money zone", () => {
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
      let spotPrice = parseUnits("1000", 8)
      let otmStrike = parseUnits("900", 8)

      await PriceProviderETH.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("555", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        otmStrike,
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
      let spotPrice = parseUnits("21343", 8)
      let otmStrike = parseUnits("19208.7", 8)

      await PriceProviderBTC.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("16666", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        otmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })
  })

  describe("Should revert payoff when exercise price = OTM strike", () => {
    it("ETH (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let spotPrice = parseUnits("1000", 8)
      let otmStrike = parseUnits("1100", 8)

      await PriceProviderETH.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = otmStrike
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let spotPrice = parseUnits("20000", 8)
      let otmStrike = parseUnits("22000", 8)

      await PriceProviderBTC.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = otmStrike
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("ETH (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let spotPrice = parseUnits("1000", 8)
      let otmStrike = parseUnits("900", 8)

      await PriceProviderETH.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = otmStrike
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let spotPrice = parseUnits("20000", 8)
      let otmStrike = parseUnits("18000", 8)

      await PriceProviderBTC.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = otmStrike
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })

  describe("Should revert payoff when exercise price is less than OTM-Call strike", () => {
    it("ETH (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let spotPrice = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1099", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let spotPrice = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("21999", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })

  describe("Should revert payoff when exercise price is more than OTM-Put strike", () => {
    it("ETH (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let spotPrice = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("901", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let spotPrice = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(spotPrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRANGLE_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("18001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
