import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getCallPayOff, getPutPayOff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyStraddle", () => {
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
      strategies.HegicStrategy_STRADDLE_ETH_1.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(atmBtcStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_STRADDLE_BTC_1.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Limit Control and available contracts", async () => {
    it("Should correct calculate available contracts when setK = 50", async () => {
      const {
        signers: [deployer],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7
      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const newLimit = parseUnits("200000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(50)
      const expectedValue = parseUnits("1102.582820048768229767", 18)

      expect(
        await strategies.HegicStrategy_STRADDLE_ETH_1.getAvailableContracts(
          period1,
          [],
        ),
      ).to.be.eq(expectedValue)
    })

    it("Should correct calculate available contracts when LimitController and setLimit < total USDC", async () => {
      const {
        signers: [deployer],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7
      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const newLimit = parseUnits("20000000000000000000000000000000000", 6)
      const globalLimit = parseUnits("20000000000000000000000000000000000", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)
      const expectedValue = parseUnits("55529296.483856378370723816", 18)

      expect(
        await strategies.HegicStrategy_STRADDLE_ETH_1.getAvailableContracts(
          period1,
          [],
        ),
      ).to.be.eq(expectedValue)
    })

    it("Should correct calculate available contracts when LimitController < setLimit", async () => {
      const {
        signers: [deployer],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7
      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const newLimit = parseUnits("200000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)
      const expectedValue = parseUnits("551.291410024384114883", 18)

      expect(
        await strategies.HegicStrategy_STRADDLE_ETH_1.getAvailableContracts(
          period1,
          [],
        ),
      ).to.be.eq(expectedValue)
    })

    it("Should correct calculate available contracts when LimitController > setLimit", async () => {
      const {
        signers: [deployer],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7

      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const strategyLimit = parseUnits("1000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        strategyLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)

      const expectedValue = parseUnits("4.552874319341159902", 18)

      expect(
        await strategies.HegicStrategy_STRADDLE_ETH_1.getAvailableContracts(
          period1,
          [],
        ),
      ).to.be.eq(expectedValue)
    })

    it("Should return 0 when current LockedByStrategy is more than setLimit", async () => {
      const {
        signers: [deployer, alice],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
        OperationalTreasury,
      } = testData
      const period1 = 86400 * 7

      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const strategyLimit = parseUnits("1000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        strategyLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)

      const maxLimit =
        await strategies.HegicStrategy_STRADDLE_ETH_1.getAvailableContracts(
          period1,
          [],
        )

      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_STRADDLE_ETH_1.address,
          alice.address,
          maxLimit.add(1e11),
          period1,
          [],
        ),
      ).to.be.revertedWith("The limit is exceeded")

      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH_1.address,
        alice.address,
        maxLimit,
        period1,
        [],
      )
    })

    it("Should revert txn when negativePnL is more than LimitController.Limit", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7
      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const newLimit = parseUnits("200000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)

      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_STRADDLE_ETH_1.address,
          alice.address,
          parseUnits("552"),
          period1,
          [],
        ),
      ).to.be.revertedWith("The limit is exceeded")
    })

    it("Should revert txn when negativePnL is more than LimitController.Limit (OPT BALANCE)", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7
      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const newLimit = parseUnits("200000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setOperationalTreasury(
        OperationalTreasury.address,
      )

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)

      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_STRADDLE_ETH_1.address,
          alice.address,
          parseUnits("552"),
          period1,
          [],
        ),
      ).to.be.revertedWith("The limit is exceeded")
    })

    it("Should revert txn when negativePnL more than setLimitByStrategy", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData

      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const strategyLimit = parseUnits("1000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        strategyLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)
      const amount = parseUnits("4.56")

      const period1 = 86400 * 7
      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_STRADDLE_ETH_1.address,
          alice.address,
          amount,
          period1,
          [],
        ),
      ).to.be.revertedWith("The limit is exceeded")
    })

    it("Should buy the strategy when negativePnL is less than setLimitByStrategy", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData
      const period1 = 86400 * 7

      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const strategyLimit = parseUnits("1000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        strategyLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)

      const amount = parseUnits("4.55")
      const negativeAndPositivePnL =
        await strategies.HegicStrategy_STRADDLE_ETH_1.calculateNegativepnlAndPositivepnl(
          amount,
          period,
          [],
        )

      await expect(() =>
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_STRADDLE_ETH_1.address,
          alice.address,
          amount,
          period1,
          [],
        ),
      ).changeTokenBalance(
        USDC,
        alice,
        negativeAndPositivePnL.positivepnl.mul(-1),
      )
    })

    it("Should buy the strategy when negativePnL is less than LimitController.Limit", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
        USDC,
        payoffPool,
        CoverPool,
        LimitController,
      } = testData

      const payoffPoolBalance = parseUnits("10000000000", 6)
      await USDC.mint(payoffPool.address, payoffPoolBalance)
      await USDC.connect(payoffPool).approve(
        CoverPool.address,
        payoffPoolBalance,
      )

      const newLimit = parseUnits("200000", 6)
      const globalLimit = parseUnits("99640", 6)
      await LimitController.connect(deployer).setLimit(globalLimit)

      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setLimit(
        newLimit,
      )
      await strategies.HegicStrategy_STRADDLE_ETH_1.connect(deployer).setK(100)

      const period1 = 86400 * 7
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH_1.address,
        alice.address,
        parseUnits("551"),
        period1,
        [],
      )
    })
  })

  describe("Should lock liquidity for correct strategy by period", async () => {
    it("Should correct calculate Lockedliquidity", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice],
        strategies,
      } = testData

      const period1 = 86400 * 7
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH_1.address,
        alice.address,
        parseUnits("1"),
        period1,
        [],
      )
      const lockedLiquidity1 = parseUnits("180.086914", 6)
      expect(
        (await OperationalTreasury.lockedLiquidity(2)).positivepnl,
      ).to.be.eq(lockedLiquidity1)
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_STRADDLE_ETH_1.address,
        ),
      ).to.be.eq(lockedLiquidity1.mul(2))

      const period2 = 86400 * 25
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH_2.address,
        alice.address,
        parseUnits("1"),
        period2,
        [],
      )
      const lockedLiquidity2 = parseUnits("279.816190", 6)
      expect(
        (await OperationalTreasury.lockedLiquidity(3)).positivepnl,
      ).to.be.eq(lockedLiquidity2)
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_STRADDLE_ETH_2.address,
        ),
      ).to.be.eq(lockedLiquidity2)

      const period3 = 86400 * 35
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH_3.address,
        alice.address,
        parseUnits("1"),
        period3,
        [],
      )
      const lockedLiquidity3 = parseUnits("345.296056", 6)
      expect(
        (await OperationalTreasury.lockedLiquidity(4)).positivepnl,
      ).to.be.eq(lockedLiquidity3)
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_STRADDLE_ETH_3.address,
        ),
      ).to.be.eq(lockedLiquidity3)

      const limit = parseUnits("1000", 6)
      await strategies.HegicStrategy_STRADDLE_ETH_3.connect(deployer).setLimit(
        limit,
      )

      await expect(
        OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_STRADDLE_ETH_3.address,
          alice.address,
          parseUnits("3"),
          period3,
          [],
        ),
      ).to.be.revertedWith("The limit is exceeded")

      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_STRADDLE_ETH_2.address,
        alice.address,
        parseUnits("1"),
        period2,
        [],
      )
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_STRADDLE_ETH_2.address,
        ),
      ).to.be.eq(lockedLiquidity2.mul(2))
    })
  })

  describe("Should correct exercise Straddle when Call Leg is in-the-money zone", () => {
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
        atmEthStrike,
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
        atmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })
  })

  describe("Should correct exercise Staddle when Put Leg is in-the-money zone", () => {
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
        atmEthStrike,
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
        atmBtcStrike,
        exericsePrice,
        btcAmount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(1, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
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
