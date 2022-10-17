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
  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)
  const period = 86400 * 7
  let ethSpotPrice = parseUnits("1000", 8)
  let btcSpotPrice = parseUnits("20000", 8)

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

    await PriceProviderETH.setPrice(ethSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )

    await PriceProviderBTC.setPrice(btcSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_INVERSE_LONG_CONDOR_20_BTC.address,
      alice.address,
      btcAmount,
      period,
      [],
    )
  })

  describe("Should correct exercise and revert Long-Buttefly-10% option", () => {
    describe("ETH", () => {
      it("should revert transcation when exercise price = price when the option was purchased [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
        } = testData

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

        let sellOtmCallStrike = parseUnits("1100", 8)
        const exericsePrice = sellOtmCallStrike
        await PriceProviderETH.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price = buyOtmCallStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmCallStrike = parseUnits("1200", 8)
        const exericsePrice = buyOtmCallStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let sellOtmPuttStrike = parseUnits("1000", 8)
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
          PriceProviderETH,
        } = testData

        let buyOtmPutStrike = parseUnits("800", 8)

        const exericsePrice = buyOtmPutStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

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
          PriceProviderETH,
        } = testData

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
          PriceProviderETH,
        } = testData

        let buyOtmCallStrike = parseUnits("1200", 8)
        const exericsePrice = parseUnits("1150", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          ethAmount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is less than sellOtmPutStrike and more than buyOtmPutStrike [9]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderETH,
        } = testData

        let buyOtmPutStrike = parseUnits("800", 8)
        const exericsePrice = parseUnits("850", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmCallStrike = parseUnits("1200", 8)
        const exericsePrice = parseUnits("200000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          buyOtmCallStrike,
          ethAmount,
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
          PriceProviderETH,
        } = testData

        let buyOtmPutStrike = parseUnits("800", 8)
        const exericsePrice = parseUnits("20", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          ethAmount,
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
        } = testData

        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("should revert whe exercise price = sellOtmCallStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        let sellOtmCallStrike = parseUnits("22000", 8)
        const exericsePrice = sellOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price = buyOtmCallStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmCallStrike = parseUnits("24000", 8)
        const exericsePrice = buyOtmCallStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("should revert when exercise price = sellOtmPutStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        let sellOtmPutStrike = parseUnits("18000", 8)
        const exericsePrice = sellOtmPutStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price = buyOtmPutStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmPutStrike = parseUnits("16000", 8)
        const exericsePrice = buyOtmPutStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })

      it("should revert when exercise price is more than spotPrice and less than sellOtmCallStrike [6]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        const exericsePrice = parseUnits("21000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("should revert when exercise price is less than spotPrice and more than sellOtmPutStrike [7]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          PriceProviderBTC,
        } = testData

        const exericsePrice = parseUnits("19000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        await expect(
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })

      it("exercise price is more than sellOtmCallStrike and less than buyOtmCallStrike [8]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmCallStrike = parseUnits("24000", 8)
        const exericsePrice = parseUnits("23000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is more than sellOtmPutStrike and less than buyOtmPutStrike [9]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmPutStrike = parseUnits("16000", 8)
        const exericsePrice = parseUnits("16500", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          exericsePrice,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })

      it("exercise price is more than buyOtmCallStrike [10]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmCallStrike = parseUnits("24000", 8)
        const exericsePrice = parseUnits("20000000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorCallLegPayoff = getLongCondorCallLegPayoff(
          buyOtmCallStrike,
          buyOtmCallStrike,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorCallLegPayoff)
      })

      it("exercise price is less than buyOtmPutStrike [11]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, ,],
          USDC,
          PriceProviderBTC,
        } = testData

        let buyOtmPutStrike = parseUnits("16000", 8)
        const exericsePrice = parseUnits("10", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getLongCondorPutLegPayoff = getLongCondorPutLegPayoff(
          buyOtmPutStrike,
          buyOtmPutStrike,
          btcAmount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(1, alice.address),
        ).changeTokenBalance(USDC, alice, _getLongCondorPutLegPayoff)
      })
    })
  })
})
