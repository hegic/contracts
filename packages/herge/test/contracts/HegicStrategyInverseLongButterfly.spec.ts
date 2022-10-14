import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {
  getLongButterflyCallLegPayoff,
  getLongButterflyPutLegPayoff,
} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyInverseLongButterfly.spec", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise and revert Long-Buttefly-10% option", () => {
    describe("ETH", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellAtmStrike
        await PriceProviderETH.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price more than sellAtmStrike and less than buyOtmCallStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1412.1232", 8)
        let buyOtmCallStrike = parseUnits("1553.33552", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("1482.72936", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price = buyOtmCallStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8)
        let buyOtmCallStrike = parseUnits("1100", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmCallStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price > buyOtmCallStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8)
        let buyOtmCallStrike = parseUnits("1100", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("2000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          buyOtmCallStrike,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price is less than sellAtmStrike and more than buyOtmPutStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1412.1232", 8)
        let buyOtmPutStrike = parseUnits("1270.91088", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("1350", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })

      it("exercise price = buyOtmPutStrike [6]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8)
        let buyOtmPutStrike = parseUnits("900", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmPutStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })

      it("exercise price < buyOtmPutStrike [7]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8)
        let buyOtmPutStrike = parseUnits("900", 8)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("20", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })
    })

    describe("BTC", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellAtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price = buyOtmCallStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmCallStrike = parseUnits("22000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "BTC",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price = sellOtmPutStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmPutStrike = parseUnits("18000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmPutStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })

      it("exercise price less than sellAtmStrike and more than buyOtmPutStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("18932", 8) //strike which the user sells
        let buyOtmPutStrike = parseUnits("17038.8", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("18000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })

      it("exercise price more than sellAtmStrike and less than buyOtmCallStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("18932", 8) //strike which the user sells
        let buyOtmCallStrike = parseUnits("20825.2", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("19500", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayofff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayofff)
      })

      it("exercise price > sellOtmCalltStrike [6]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmCallStrike = parseUnits("22000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price < sellOtmPuttStrike [7]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmPutStrike = parseUnits("18000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("10", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })
    })
  })
})
