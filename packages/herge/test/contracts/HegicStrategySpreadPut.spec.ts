import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getBearPutSpreadPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategySpreadPut", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise Bear-Put-Spread-10% when exercise price is more than OTM strike", () => {
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
      let otmStrike = parseUnits("900", 8)

      await PriceProviderETH.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("950", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmStrike,
        otmStrike,
        exericsePrice,
        amount,
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
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)
      let otmStrike = parseUnits("18000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("19000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmStrike,
        otmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })
  })

  describe("Should correct exercise Bear-Put-Spread-10% when exercise price is equal OTM strike", () => {
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
      let otmStrike = parseUnits("900", 8)

      await PriceProviderETH.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = otmStrike
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmStrike,
        otmStrike,
        exericsePrice,
        amount,
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
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)
      let otmStrike = parseUnits("18000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = otmStrike
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmStrike,
        otmStrike,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
    })
  })

  describe("Should correct exercise Bear-Put-Spread when exercise price is less than OTM strike", () => {
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
      let otmStrike = parseUnits("900", 8)

      await PriceProviderETH.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("10", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmStrike,
        otmStrike,
        exericsePrice,
        amount,
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
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)
      let otmStrike = parseUnits("18000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("10", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getBearPutSpreadPayOff = getBearPutSpreadPayOff(
        atmStrike,
        otmStrike,
        exericsePrice,
        amount,
        "BTC",
      )
      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getBearPutSpreadPayOff)
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
        strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
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
        strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
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
  describe("Should revert payoff when exercise price is more than atm strike price", () => {
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
        strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
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
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("0.1", 8)
      const period = 86400 * 7
      let atmStrike = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(atmStrike)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("20001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
