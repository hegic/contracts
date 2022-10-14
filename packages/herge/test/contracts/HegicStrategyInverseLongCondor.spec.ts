import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"
import {
  getLongCondorCallLegPayoff,
  getLongCondorPutLegPayoff,
} from "../utils/helpers"
import {initializePools} from "../utils/contracts"

describe("HegicStrategyInverseLongCondor.spec", () => {
  let testData: Fixture

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise and revert Long-Buttefly-10% option", () => {
    describe("ETH", () => {
      it("should revert transcation when exercise price = price when the option was purchased [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("should revert whe exercise price = sellOtmCallStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let sellOtmCallStrike = parseUnits("1100", 8)

        await PriceProviderETH.setPrice(sellOtmCallStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellOtmCallStrike
        await PriceProviderETH.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
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
        let spotPrice = parseUnits("1000", 8)
        let buyOtmCallStrike = parseUnits("1200", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmCallStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("should revert when exercise price = sellOtmPutStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)
        let sellOtmPuttStrike = parseUnits("1000", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellOtmPuttStrike
        await PriceProviderETH.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price = buyOtmPutStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)
        let buyOtmPutStrike = parseUnits("800", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = buyOtmPutStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })

      it("should revert when exercise price is more than spotPrice and less than sellOtmCallStrike [6]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("1050", 8)
        await PriceProviderETH.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("should revert when exercise price is less than spotPrice and more than sellOtmPutStrike [7]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("950", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price is more than sellOtmCallStrike and less than buyOtmCallStrike [8]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let spotPrice = parseUnits("1412.1232", 8)
        let buyOtmPutStrike = parseUnits("1694.54784", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("1600", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is more than sellOtmPutStrike and less than buyOtmPutStrike [9]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let spotPrice = parseUnits("1412.1232", 8)
        let buyOtmPutStrike = parseUnits("1129.69856", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("1200", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })

      it("exercise price is more than buyOtmCallStrike [10]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)
        let buyOtmCallStrike = parseUnits("1200", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("200000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          buyOtmCallStrike,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is less than buyOtmPutStrike [11]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("2")
        const period = 86400 * 7
        let spotPrice = parseUnits("1000", 8)
        let buyOtmPutStrike = parseUnits("1200", 8)

        await PriceProviderETH.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("200000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })
    })

    describe("BTC", () => {
      it("should revert transcation when exercise price = price when the option was purchased [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("should revert whe exercise price = sellOtmCallStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let sellOtmCallStrike = parseUnits("22000", 8)

        await PriceProviderBTC.setPrice(sellOtmCallStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price = buyOtmCallStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)
        let buyOtmCallStrike = parseUnits("24000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("should revert when exercise price = sellOtmPutStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)
        let sellOtmPutStrike = parseUnits("18000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellOtmPutStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price = buyOtmPutStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)
        let buyOtmPutStrike = parseUnits("16000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = buyOtmPutStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })

      it("should revert when exercise price is more than spotPrice and less than sellOtmCallStrike [6]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("21000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("should revert when exercise price is less than spotPrice and more than sellOtmPutStrike [7]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("19000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price is more than sellOtmCallStrike and less than buyOtmCallStrike [8]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("18923", 8)
        let buyOtmCallStrike = parseUnits("22707.6", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("21000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is more than sellOtmPutStrike and less than buyOtmPutStrike [9]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("18923", 8)
        let buyOtmPutStrike = parseUnits("15138.4", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("16500", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })

      it("exercise price is more than buyOtmCallStrike [10]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)
        let buyOtmCallStrike = parseUnits("24000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("20000000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          buyOtmCallStrike,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is less than buyOtmPutStrike [11]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("2", 8)
        const period = 86400 * 7
        let spotPrice = parseUnits("20000", 8)
        let buyOtmPutStrike = parseUnits("16000", 8)

        await PriceProviderBTC.setPrice(spotPrice)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )

        const exericsePrice = parseUnits("10", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })
    })
  })
})
