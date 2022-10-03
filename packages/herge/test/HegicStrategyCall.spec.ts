import {expect} from "chai"
import {fixture, Fixture} from "./utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes, formatUnits} from "ethers/lib/utils"
import {constants, BigNumberish, ethers, BigNumber} from "ethers"
import {getCallPayOff} from "./utils/helper"
import {initializePools} from "./utils/contracts"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

describe("HegicStrategyCall", () => {
  let testData: Fixture

  const show = async (testData: Fixture) =>
    console.log(
      (await testData.OperationalTreasury.totalBalance()).toNumber() / 1e6,
      (await testData.OperationalTreasury.lockedPremium()).toNumber() / 1e6,
      (await testData.OperationalTreasury.totalLocked()).toNumber() / 1e6,
    )

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise option", () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let stikePrice = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1200", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1.5")
      const period = 86400 * 7
      const spotPrice = parseUnits("1000", 8)
      const stikePrice = parseUnits("1100", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_110_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1500", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("1", 8)
      const period = 86400 * 7
      let stikePrice = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("22000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("1.5", 8)
      const period = 86400 * 7
      const spotPrice = parseUnits("20000", 8)
      const stikePrice = parseUnits("22000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_110_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("25000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getCallPayOff = getCallPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getCallPayOff)
    })
  })

  describe("Should revert payoff when exercise price = strike price", () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let stikePrice = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1000", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1.5")
      const period = 86400 * 7
      const spotPrice = parseUnits("1000", 8)
      const stikePrice = parseUnits("1100", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_110_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1100", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("1", 8)
      const period = 86400 * 7
      let stikePrice = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("20000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("1.5", 8)
      const period = 86400 * 7
      const spotPrice = parseUnits("20000", 8)
      const stikePrice = parseUnits("22000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_110_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("22000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })

  describe("Should revert payoff when exercise price is less than strike price", () => {
    it("ETH-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1")
      const period = 86400 * 7
      let stikePrice = parseUnits("1000", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("999", 8)
      await PriceProviderETH.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("ETH-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const amount = parseUnits("1.5")
      const period = 86400 * 7
      const spotPrice = parseUnits("1000", 8)
      const stikePrice = parseUnits("1100", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_110_ETH.address,
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

    it("BTC-ATM", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("1", 8)
      const period = 86400 * 7
      let stikePrice = parseUnits("20000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_100_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("19999", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })

    it("BTC-OTM-10%", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderBTC,
      } = testData

      const amount = parseUnits("1.5", 8)
      const period = 86400 * 7
      const spotPrice = parseUnits("20000", 8)
      const stikePrice = parseUnits("22000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_CALL_110_BTC.address,
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
})
