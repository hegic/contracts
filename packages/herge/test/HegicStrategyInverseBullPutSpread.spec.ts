import {expect} from "chai"
import {fixture, Fixture} from "./utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes, formatUnits} from "ethers/lib/utils"
import {constants, BigNumberish, ethers, BigNumber} from "ethers"
import {getInversePutPayOff} from "./utils/helper"
import {parse} from "path"
import {initializePools} from "./utils/contracts"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

describe("HegicStrategyInverseBullPutSpread.spec", () => {
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

  describe("Should correct exercise and revert Bear-Call-Spread-10% option", () => {
    describe("ETH", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH.address,
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

      it("exercise price = buyOtmStrike[2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1412.1232", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("1270.91088", 8) //strike which the user buys (hedge)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getInversePutPayOff = getInversePutPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "ETH",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInversePutPayOff)
      })

      it("exercise price is less than sellAtmStrike and more than buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1412.1232", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("1270.91088", 8) //strike which the user buys (hedge)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("1341.51704", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getInversePutPayOff = getInversePutPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInversePutPayOff)
      })

      it("exercise price < buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("900", 8) //strike which the user buys (hedge)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("10", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getInversePutPayOff = getInversePutPayOff(
          buyOtmStrike,
          buyOtmStrike,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInversePutPayOff)
      })

      it("should revert transcation when exercise price > sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
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
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC.address,
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

      it("exercise price = buyOtmStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("18000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getInversePutPayOff = getInversePutPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "BTC",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInversePutPayOff)
      })

      it("exercise price < buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("18000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("40", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getInversePutPayOff = getInversePutPayOff(
          buyOtmStrike,
          buyOtmStrike,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInversePutPayOff)
      })

      it("exercise price less than sellAtmStrike and more than buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("18923", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("17030.7", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("18400", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getInversePutPayOff = getInversePutPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInversePutPayOff)
      })

      it("should revert transcation when exercise price > sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("40000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })
    })
  })
})
