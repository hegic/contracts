import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getPutPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyPut", () => {
  let testData: Fixture

  const ethAmount = parseUnits("2")
  const period = 86400 * 7
  let ethSpotPrice = parseUnits("1000", 8)
  const btcAmount = parseUnits("2", 8)
  let btcSpotPrice = parseUnits("20000", 8)

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
    const {
      OperationalTreasury,
      signers: [, alice],
      USDC,
      strategies,
      PriceProviderETH,
      PriceProviderBTC,
    } = testData

    await PriceProviderETH.setPrice(ethSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_100_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_90_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(btcSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_100_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )

    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_90_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise option", () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("700", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        ethSpotPrice,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const ethOtmStrike = parseUnits("900", 8)
      const exericsePrice = parseUnits("655", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        ethOtmStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("18000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        btcSpotPrice,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(2, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const btcOtmStrike = parseUnits("18000", 8)
      const exericsePrice = parseUnits("15000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        btcOtmStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(3, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
    })
  })

  describe("Should revert payoff when exercise price = strike price", () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1000", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData
      const exericsePrice = parseUnits("1100", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("20000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(2, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("22000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(3, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })

  describe("Should revert payoff when exercise price is less than strike price", () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1001", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1101", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("20001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(2, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("22001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(3, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
