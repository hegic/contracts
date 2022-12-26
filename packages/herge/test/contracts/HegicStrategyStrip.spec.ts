import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getStripCallLegPayOff, getStripPutLegPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyStrip.spec", () => {
  let testData: Fixture

  const ethAmount = parseUnits("1")
  const period = 86400 * 7
  let atmEthStrike = parseUnits("1000", 8)

  const btcAmount = parseUnits("0.1", 8)
  let atmBtcStrike = parseUnits("20000", 8)

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
    const {
      OperationalTreasury,
      signers: [, alice, ,],
      USDC,
      strategies,
      PriceProviderETH,
      PriceProviderBTC,
    } = testData

    await PriceProviderETH.setPrice(atmEthStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_STRIP_ETH_1.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(atmBtcStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_STRIP_BTC_1.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise Strip when Call Leg is in-the-money zone", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1200", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getStripCallLegPayOff = getStripCallLegPayOff(
        atmEthStrike,
        exericsePrice,
        ethAmount,
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
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("23212", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getStripCallLegPayOff = getStripCallLegPayOff(
        atmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getStripCallLegPayOff)
    })
  })

  describe("Should correct exercise Strip when Put Leg is in-the-money zone", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("700", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getStripPutLegPayOff = getStripPutLegPayOff(
        atmEthStrike,
        exericsePrice,
        ethAmount,
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
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("16666", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getStripPutLegPayOff = getStripPutLegPayOff(
        atmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getStripPutLegPayOff)
    })
  })

  describe("Should revert payoff when exercise price = atm strike price", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = atmEthStrike
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = atmBtcStrike
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
