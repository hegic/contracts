import {expect} from "chai"
import {fixture, Fixture} from "./utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes, formatUnits} from "ethers/lib/utils"
import {constants, BigNumberish, ethers, BigNumber} from "ethers"
import {getPutPayOff} from "./utils/helper"
import {initializePools} from "./utils/contracts"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

async function initPools({
  OptionsManager,
  OperationalTreasury,
  HEGIC,
  CoverPool,
  USDC,
  payoffPool,
  signers: [deployer, alice, bob, carl],
}: Fixture) {
  await HEGIC.mint(carl.address, parseUnits("1000000000000"))
  await HEGIC.connect(carl).approve(CoverPool.address, constants.MaxUint256)

  await HEGIC.mint(bob.address, parseUnits("100000"))
  await HEGIC.connect(bob).approve(CoverPool.address, constants.MaxUint256)

  await USDC.mint(payoffPool.address, parseUnits("1000000"))
  await USDC.connect(payoffPool).approve(
    CoverPool.address,
    parseUnits("1000000"),
  )
  await CoverPool.grantRole(OPERATIONAL_TRESUARY_ROLE, deployer.address)

  await USDC.mint(alice.address, 100000e6)
  await CoverPool.connect(carl).provide(parseUnits("1000000000000"), 0)
  await CoverPool.connect(bob).provide(parseUnits("50"), 0)

  await CoverPool.grantRole(
    OPERATIONAL_TRESUARY_ROLE,
    OperationalTreasury.address,
  )

  //todo transfer to deploy
  await OptionsManager.grantRole(
    await OptionsManager.HEGIC_POOL_ROLE(),
    OperationalTreasury.address,
  )

  //Operational
  await USDC.mint(OperationalTreasury.address, 100000e6)
  await OperationalTreasury.addTokens()
  await USDC.mint(alice.address, parseUnits("10000000000000"))

  let benchmark = 100000e6
  await OperationalTreasury.connect(deployer).setBenchmark(benchmark)

  await USDC.connect(alice).approve(
    OperationalTreasury.address,
    parseUnits("10000000000000"),
  )
}

describe("HegicStrategyPut", () => {
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
        strategies.HegicStrategy_PUT_100_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("700", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
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
      const stikePrice = parseUnits("900", 8)

      await PriceProviderETH.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_PUT_90_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("655", 8)
      await PriceProviderETH.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "ETH",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
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
        strategies.HegicStrategy_PUT_100_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("18000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
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
      const stikePrice = parseUnits("18000", 8)

      await PriceProviderBTC.setPrice(stikePrice)
      await OperationalTreasury.connect(alice).buy(
        strategies.HegicStrategy_PUT_90_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("15000", 8)
      await PriceProviderBTC.setPrice(exericsePrice)

      const _getPutPayOff = getPutPayOff(
        stikePrice,
        exericsePrice,
        amount,
        "BTC",
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, _getPutPayOff)
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
        strategies.HegicStrategy_PUT_100_ETH.address,
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
        strategies.HegicStrategy_PUT_90_ETH.address,
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
        strategies.HegicStrategy_PUT_100_BTC.address,
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
        strategies.HegicStrategy_PUT_90_BTC.address,
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
        strategies.HegicStrategy_PUT_100_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1001", 8)
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
        strategies.HegicStrategy_PUT_90_ETH.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("1101", 8)
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
        strategies.HegicStrategy_PUT_100_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("20001", 8)
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
        strategies.HegicStrategy_PUT_90_BTC.address,
        alice.address,
        amount,
        period,
        [],
      )
      const exericsePrice = parseUnits("22001", 8)
      await PriceProviderBTC.setPrice(exericsePrice)
      await expect(
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).to.be.revertedWith("You can not execute this option strat")
    })
  })
})
