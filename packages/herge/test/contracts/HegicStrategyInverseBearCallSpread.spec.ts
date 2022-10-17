import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {getBearCallSpreadPayoff} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyInverseBearCallSpread.spec", () => {
  let testData: Fixture

  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)

  const period = 86400 * 7
  let sellEthAtmStrike = parseUnits("1000", 8) //strike which the user sells
  let sellBtchAtmStrike = parseUnits("20000", 8) //strike which the user sells

  beforeEach(async () => {
    testData = await fixture()
    const {
      OperationalTreasury,
      signers: [, alice, ,],
      strategies,
      PriceProviderETH,
      PriceProviderBTC,
    } = testData
    await initializePools(testData)

    await PriceProviderETH.setPrice(sellEthAtmStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(sellBtchAtmStrike)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
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

      it("exercise price more than ATM Strike and less than OTM Strike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)
        const exericsePrice = parseUnits("1051", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          ethAmount,
          "ETH",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
      })

      it("exercise price = buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)
        const exericsePrice = buyOtmStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          ethAmount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
      })

      it("exercise price > buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)
        const exericsePrice = parseUnits("2000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
          buyOtmStrike,
          buyOtmStrike,
          ethAmount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
      })

      it("should revert transcation when exercise price < sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderETH,
        } = testData

        const exericsePrice = parseUnits("10", 8)
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

        const exericsePrice = sellBtchAtmStrike
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

        let buyOtmStrike = parseUnits("22000", 8) //strike which the user buys (hedge)
        const exericsePrice = buyOtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
      })

      it("exercise price > buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmStrike = parseUnits("22000", 8) //strike which the user buys (hedge)
        await PriceProviderBTC.setPrice(sellBtchAtmStrike)
        const exericsePrice = parseUnits("40000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
          buyOtmStrike,
          buyOtmStrike,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
      })

      it("exercise price more than sellAtmStrike and less than buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmStrike = parseUnits("22000", 8) //strike which the user buys (hedge)
        const exericsePrice = parseUnits("21500", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getBearCallSpreadPayoff = getBearCallSpreadPayoff(
          buyOtmStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getBearCallSpreadPayoff)
      })

      it("should revert transcation when exercise price < sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        const exericsePrice = parseUnits("10", 8)
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })
    })
  })
})
