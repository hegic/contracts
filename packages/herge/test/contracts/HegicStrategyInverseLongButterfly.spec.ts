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
  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)

  const period = 86400 * 7
  let sellEthAtmStrike = parseUnits("1412.1232", 8)
  let sellBtcAtmStrike = parseUnits("18932", 8)

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
    const {
      OperationalTreasury,
      signers: [deployer, alice, ,],
      strategies,
      PriceProviderETH,
      PriceProviderBTC,
    } = testData

    await PriceProviderETH.setPrice(sellEthAtmStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(sellBtcAtmStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_LONG_BUTTERFLY_10_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise and revert Long-Buttefly-10% option", () => {
    describe("ETH", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderETH,
        } = testData

        const exericsePrice = sellEthAtmStrike
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
          PriceProviderETH,
        } = testData

        let buyOtmCallStrike = parseUnits("1553.33552", 8)
        const exericsePrice = parseUnits("1482.72936", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmCallStrike = parseUnits("1100", 8)
        const exericsePrice = buyOtmCallStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmCallStrike = parseUnits("1100", 8)
        const exericsePrice = parseUnits("2000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          buyOtmCallStrike,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmPutStrike = parseUnits("1270.91088", 8)
        const exericsePrice = parseUnits("1350", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmPutStrike = parseUnits("900", 8)
        const exericsePrice = buyOtmPutStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmPutStrike = parseUnits("900", 8)
        const exericsePrice = parseUnits("20", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          ethAmount,
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
          PriceProviderBTC,
        } = testData

        const exericsePrice = sellBtcAtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price = buyOtmCallStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmCallStrike = parseUnits("20825.2", 8)
        const exericsePrice = buyOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price = sellOtmPutStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmPutStrike = parseUnits("17038.8", 8) //strike which the user buys (hedge)
        const exericsePrice = buyOtmPutStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })

      it("exercise price less than sellAtmStrike and more than buyOtmPutStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmPutStrike = parseUnits("17038.8", 8) //strike which the user buys (hedge)
        const exericsePrice = parseUnits("18000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })

      it("exercise price more than sellAtmStrike and less than buyOtmCallStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmCallStrike = parseUnits("20825.2", 8) //strike which the user buys (hedge)
        const exericsePrice = parseUnits("20000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayofff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayofff)
      })

      it("exercise price > sellOtmCalltStrike [6]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmCallStrike = parseUnits("20825.2", 8) //strike which the user buys (hedge)
        const exericsePrice = buyOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyCallLegPayoff = getLongButterflyCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyCallLegPayoff)
      })

      it("exercise price < sellOtmPuttStrike [7]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmPutStrike = parseUnits("17038.8", 8)
        const exericsePrice = parseUnits("10", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongButterflyPutLegPayoff = getLongButterflyPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongButterflyPutLegPayoff)
      })
    })
  })
})
