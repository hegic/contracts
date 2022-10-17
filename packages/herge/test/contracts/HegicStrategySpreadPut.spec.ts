import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getBearPutSpreadPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategySpreadPut", () => {
  let testData: Fixture
  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)
  const period = 86400 * 7
  let atmEthStrike = parseUnits("1000", 8)
  let otmEthStrike = parseUnits("900", 8)

  let atmBtcStrike = parseUnits("20000", 8)
  let otmBtcStrike = parseUnits("18000", 8)

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

    await PriceProviderETH.setPrice(atmEthStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(atmBtcStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise Bear-Put-Spread-10% when exercise price is more than OTM strike", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("950", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmEthStrike,
        otmEthStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("19000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmBtcStrike,
        otmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })
  })

  describe("Should correct exercise Bear-Put-Spread-10% when exercise price is equal OTM strike", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = otmEthStrike
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmEthStrike,
        otmEthStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = otmBtcStrike
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmBtcStrike,
        otmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })
  })

  describe("Should correct exercise Bear-Put-Spread when exercise price is less than OTM strike", () => {
    it("ETH", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("10", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmEthStrike,
        otmEthStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )
      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("10", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmBtcStrike,
        otmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )
      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
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
  describe("Should revert payoff when exercise price is more than atm strike price", () => {
    it("ETH", async () => {
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

    it("BTC", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("20001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
