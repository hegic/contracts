import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getBullCallSpreadPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategySpreadCall", () => {
  let testData: Fixture

  const ethAmount = parseUnits("1")
  const period = 86400 * 7
  let atmEthStrike = parseUnits("1000", 8)
  let otmEthStrike = parseUnits("1100", 8)

  const btcAmount = parseUnits("0.1", 8)
  let atmBtcStrike = parseUnits("20000", 8)
  let otmBtcStrike = parseUnits("22000", 8)

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
      strategies.HegicStrategy_SPREAD_CALL_10_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(atmBtcStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_SPREAD_CALL_10_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise Bull-Call-Spread-10% when exercise price is less than OTM strike", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1050", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBullCallSpreadPayOff = getBullCallSpreadPayOff(
        atmEthStrike,
        otmEthStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBullCallSpreadPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("21500", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBullCallSpreadPayOff = getBullCallSpreadPayOff(
        atmBtcStrike,
        otmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getBullCallSpreadPayOff)
    })
  })

  describe("Should correct exercise Bull-Call-Spread when exercise price is equal OTM strike", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1100", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBullCallSpreadPayOff = getBullCallSpreadPayOff(
        atmEthStrike,
        otmEthStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBullCallSpreadPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("22000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBullCallSpreadPayOff = getBullCallSpreadPayOff(
        atmBtcStrike,
        otmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getBullCallSpreadPayOff)
    })
  })

  describe("Should correct exercise Bull-Call-Spread when exercise price is more than OTM strike", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1600", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBullCallSpreadPayOff = getBullCallSpreadPayOff(
        atmEthStrike,
        otmEthStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBullCallSpreadPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("27000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBullCallSpreadPayOff = getBullCallSpreadPayOff(
        atmBtcStrike,
        otmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getBullCallSpreadPayOff)
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
  describe("Should revert payoff when exercise price is less than atm strike price", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("999", 8)
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

      const exericsePrice = parseUnits("19999", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
