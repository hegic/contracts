import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getBullPutSpreadPayoff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyInverseBullPutSpread.spec", () => {
  let testData: Fixture

  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)

  const period = 86400 * 7
  let sellEthAtmStrike = parseUnits("1412.1232", 8)
  let sellBtcAtmStrike = parseUnits("20000", 8)

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

    await PriceProviderETH.setPrice(sellEthAtmStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(sellBtcAtmStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise and revert Bear-Call-Spread-10% option", () => {
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

      it("exercise price = buyOtmStrike[2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmStrike = parseUnits("1270.91088", 8) //strike which the user buys (hedge)
        const exericsePrice = buyOtmStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getBullPutSpreadPayoff = getBullPutSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          ethAmount,
          "ETH",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getBullPutSpreadPayoff)
      })

      it("exercise price is less than sellAtmStrike and more than buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmStrike = parseUnits("1270.91088", 8) //strike which the user buys (hedge)
        const exericsePrice = parseUnits("1341.51704", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getBullPutSpreadPayoff = getBullPutSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          ethAmount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getBullPutSpreadPayoff)
      })

      it("exercise price < buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmStrike = parseUnits("900", 8) //strike which the user buys (hedge)

        const exericsePrice = parseUnits("10", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getBullPutSpreadPayoff = getBullPutSpreadPayoff(
          buyOtmStrike,
          buyOtmStrike,
          ethAmount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getBullPutSpreadPayoff)
      })

      it("should revert transcation when exercise price > sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderETH,
        } = testData

        const exericsePrice = parseUnits("2000", 8)
        await PriceProviderETH.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })
    })

    describe("BTC", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        const exericsePrice = sellAtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price = buyOtmStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmStrike = parseUnits("18000", 8) //strike which the user buys (hedge)
        const exericsePrice = buyOtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getBullPutSpreadPayoff = getBullPutSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getBullPutSpreadPayoff)
      })

      it("exercise price < buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmStrike = parseUnits("18000", 8) //strike which the user buys (hedge)

        const exericsePrice = parseUnits("40", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getBullPutSpreadPayoff = getBullPutSpreadPayoff(
          buyOtmStrike,
          buyOtmStrike,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getBullPutSpreadPayoff)
      })

      it("exercise price less than sellAtmStrike and more than buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmStrike = parseUnits("18000", 8)
        const exericsePrice = parseUnits("18400", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getBullPutSpreadPayoff = getBullPutSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getBullPutSpreadPayoff)
      })

      it("should revert transcation when exercise price > sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        const exericsePrice = parseUnits("40000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })
    })
  })
})
