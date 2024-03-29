import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getCallPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyCall", () => {
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
      signers: [deployer, alice],
      strategies,
      PriceProviderETH,
      PriceProviderBTC,
    } = testData

    const limit = parseUnits("10000000", 6)
    await strategies.HegicStrategy_CALL_100_ETH_1.connect(deployer).setLimit(
      limit,
    )
    await strategies.HegicStrategy_CALL_110_ETH_1.connect(deployer).setLimit(
      limit,
    )
    await strategies.HegicStrategy_CALL_100_BTC_1.connect(deployer).setLimit(
      limit,
    )
    await strategies.HegicStrategy_CALL_110_BTC_1.connect(deployer).setLimit(
      limit,
    )

    await PriceProviderETH.setPrice(ethSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_CALL_100_ETH_1.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_CALL_110_ETH_1.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(btcSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_CALL_100_BTC_1.address,
      alice.address,
      btcAmount,
      period,
      [],
    )

    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_CALL_110_BTC_1.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct calcualte Lockedliquidity for strategy with different period", async () => {
    it("Should correct calcualte Lockedliquidity", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      const period1 = 86400 * 7
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH_1.address,
        alice.address,
        parseUnits("1"),
        period1,
        [],
      )
      const lockedLiquidity1 = parseUnits("90.043457", 6)
      expect(
        (await OperationalTreasury.lockedLiquidity(4)).positivepnl,
      ).to.be.eq(lockedLiquidity1)
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_CALL_100_ETH_1.address,
        ),
      ).to.be.eq(lockedLiquidity1.mul(3))

      const period2 = 86400 * 25

      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH_2.address,
        alice.address,
        parseUnits("1"),
        period2,
        [],
      )
      const lockedLiquidity2 = parseUnits("139.908095", 6)
      expect(
        (await OperationalTreasury.lockedLiquidity(5)).positivepnl,
      ).to.be.eq(lockedLiquidity2)
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_CALL_100_ETH_2.address,
        ),
      ).to.be.eq(lockedLiquidity2)

      const period3 = 86400 * 35

      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH_3.address,
        alice.address,
        parseUnits("1"),
        period3,
        [],
      )
      const lockedLiquidity3 = parseUnits("172.648028", 6)
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_CALL_100_ETH_3.address,
        ),
      ).to.be.eq(lockedLiquidity3)
      expect(
        (await OperationalTreasury.lockedLiquidity(6)).positivepnl,
      ).to.be.eq(lockedLiquidity3)
    })

    it("Should revert transcation HegicStrategy_CALL_100_ETH_1 when period is more than 14 days", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      const period = 86400 * 15
      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_CALL_100_ETH_1.address,
          alice.address,
          parseUnits("1"),
          period,
          [],
        ),
      ).revertedWith("Period is wrong")
    })

    it("Should revert transcation HegicStrategy_CALL_100_ETH_2 when period is more than 30 days", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      const period = 86400 * 31
      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_CALL_100_ETH_2.address,
          alice.address,
          parseUnits("1"),
          period,
          [],
        ),
      ).revertedWith("Period is wrong")
    })

    it("Should revert transcation HegicStrategy_CALL_100_ETH_3 when period is more thans 60 days", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      const period = 86400 * 61
      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_CALL_100_ETH_3.address,
          alice.address,
          parseUnits("1"),
          period,
          [],
        ),
      ).revertedWith("Period is wrong")
    })
  })

  describe("Limits and collaterezation", async () => {
    it("should correct calcualte 'negativePnL' when 'setK' = 200", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      await strategies.HegicStrategy_CALL_100_ETH_1.connect(deployer).setK(200)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH_1.address,
        alice.address,
        parseUnits("1"),
        period,
        [],
      )

      expect(
        (await OperationalTreasury.lockedLiquidity(4)).negativepnl,
      ).to.be.eq(parseUnits("180.086914", 6))

      expect(
        (await OperationalTreasury.lockedLiquidity(4)).positivepnl,
      ).to.be.eq(parseUnits("90.043457", 6))
    })

    it("should correct calcualte 'negativePnL' when 'setK' = 50", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      await strategies.HegicStrategy_CALL_100_ETH_1.connect(deployer).setK(50)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH_1.address,
        alice.address,
        parseUnits("1"),
        period,
        [],
      )

      expect(
        (await OperationalTreasury.lockedLiquidity(4)).negativepnl,
      ).to.be.eq(parseUnits("45.021728", 6))

      expect(
        (await OperationalTreasury.lockedLiquidity(4)).positivepnl,
      ).to.be.eq(parseUnits("90.043457", 6))
    })

    it("should set new 'SetLimit'", async () => {
      const {
        signers: [deployer],
        strategies,
      } = testData
      const newLimit = parseUnits("100", 6)
      await strategies.HegicStrategy_CALL_100_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      expect(
        await strategies.HegicStrategy_CALL_100_ETH_1.lockedLimit(),
      ).to.be.eq(newLimit)
    })
  })

  describe("Should correct exercise option", async () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice],
        USDC,
        PriceProviderETH,
      } = testData

      const exericsePrice = parseUnits("1200", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        ethSpotPrice,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const ethOtmStrike = parseUnits("1100", 8)
      const exericsePrice = parseUnits("1500", 8)

      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        ethOtmStrike,
        exericsePrice,
        ethAmount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const exericsePrice = parseUnits("22000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        btcSpotPrice,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(2, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        PriceProviderBTC,
      } = testData

      const btcOtmStrike = parseUnits("22000", 8)
      const exericsePrice = parseUnits("25000", 8)

      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        btcOtmStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(3, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
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

      const exericsePrice = parseUnits("999", 8)
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

      const exericsePrice = parseUnits("1099", 8)
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

      const exericsePrice = parseUnits("19999", 8)
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

      const exericsePrice = parseUnits("21999", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(3, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
