import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getCallPayOff, getPutPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyStrangle.spec", () => {
  let testData: Fixture

  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)

  const period = 86400 * 7
  let spotEthPrice = parseUnits("1000", 8)
  let otmEthCallStrike = parseUnits("1100", 8)
  let otmEthPutStrike = parseUnits("900", 8)

  let spotBtcPrice = parseUnits("20000", 8)
  let otmBtcCallStrike = parseUnits("22000", 8)
  let otmBtcPutStrike = parseUnits("18000", 8)

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
    const {
      OperationalTreasury,
      signers: [, alice, ,],
      strategies,
      PriceProviderETH,
      PriceProviderBTC,
    } = testData

    await PriceProviderETH.setPrice(spotEthPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_STRANGLE_10_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(spotBtcPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_STRANGLE_10_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise Strangle-10% when Call Leg is in-the-money zone", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1444", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        otmEthCallStrike,
        exericsePrice,
        ethAmount,
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
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("23212", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        otmBtcCallStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })
  })

  describe("Should correct exercise Strangle-10% when Put Leg is in-the-money zone", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("555", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        otmEthPutStrike,
        exericsePrice,
        ethAmount,
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
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("16666", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        otmBtcPutStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })
  })

  describe("Should revert payoff when exercise price = OTM strike", () => {
    it("ETH (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = otmEthCallStrike
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = otmBtcCallStrike
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("ETH (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = otmEthPutStrike
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = otmBtcPutStrike
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })

  describe("Should revert payoff when exercise price is less than OTM-Call strike", () => {
    it("ETH (call leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

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
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("21999", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })

  describe("Should revert payoff when exercise price is more than OTM-Put strike", () => {
    it("ETH (put leg)", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

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
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("18001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
