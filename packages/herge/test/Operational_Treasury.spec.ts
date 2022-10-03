import {expect} from "chai"
import {fixture, Fixture} from "./utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes, formatUnits} from "ethers/lib/utils"
import {constants, BigNumberish, ethers, BigNumber} from "ethers"
import {timeAndMine, ethers as e2} from "hardhat"
import {timeStamp} from "console"
import {connect} from "http2"
import {parse} from "path"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

describe("Operational Pool", () => {
  let testData: Fixture

  const show = async (testData: Fixture) =>
    console.log(
      (await testData.OperationalTreasury.totalBalance()).toNumber() / 1e6,
      (await testData.OperationalTreasury.lockedPremium()).toNumber() / 1e6,
      (await testData.OperationalTreasury.totalLocked()).toNumber() / 1e6,
    )

  beforeEach(async () => {
    const {
      PriceProviderETH,
      OptionsManager,
      OperationalTreasury,
      HEGIC,
      CoverPool,
      USDC,
      payoffPool,
      signers: [deployer, alice, bob, carl],
      signers,
      strategies,
    } = (testData = await fixture())

    //Cover Pool
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

    const amount = parseUnits("1")
    const period = 86400 * 7
    const stikePrice = 1000e8

    await PriceProviderETH.setPrice(stikePrice)

    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_100_ETH.address,
      alice.address,
      amount,
      period,
      [],
    )
  })

  describe("Operational Treasury (OPT)", () => {
    it("should lock USDC into Operational Treasury", async () => {
      const {
        OperationalTreasury,
        CoverPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        BasePriceCalculator_PUT_ETH,
        PriceProviderETH,
      } = testData
      const OptionCost = await BasePriceCalculator_PUT_ETH.calculatePremium(
        86400 * 7,
        parseUnits("1"),
        0,
      )
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_PUT_100_ETH.address,
        ),
      ).to.be.eq(OptionCost)
    })

    it("should unlock USDC when option is expired", async () => {
      const {
        OperationalTreasury,
        CoverPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
      } = testData

      const initialBalance = await OperationalTreasury.totalBalance()
      const positoin = await OperationalTreasury.lockedLiquidity(0)

      await timeAndMine.setTimeIncrease("8d")
      await OperationalTreasury.unlock(0)

      expect(await OperationalTreasury.totalLocked()).to.be.eq(0)
      expect(await OperationalTreasury.totalBalance()).to.be.eq(
        initialBalance.add(positoin.positivepnl),
      )
    })

    it("should send USDC to the option holder when option is exercised", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const exercisePrice = 800e8
      const expectedProfit = 200e6

      await PriceProviderETH.setPrice(exercisePrice)
      const profit = await strategies.HegicStrategy_PUT_100_ETH.payOffAmount(0)

      expect(profit).to.be.eq(expectedProfit)

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalances(
        USDC,
        [alice, OperationalTreasury],
        [profit, profit.mul(-1)],
      )

      expect(await OperationalTreasury.totalLocked()).to.be.eq(0)
    })

    it("should withdraw USDC from the OPT", async () => {
      const {
        OperationalTreasury,
        CoverPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      let InitialBalance = await OperationalTreasury.totalBalance()
      await expect(
        async () =>
          await OperationalTreasury.connect(deployer).withdraw(
            alice.address,
            await OperationalTreasury.totalBalance(),
          ),
      ).changeTokenBalance(USDC, alice, InitialBalance)
    })

    it("should replenish", async () => {
      const {
        OperationalTreasury,
        CoverPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const newPrice = await PriceProviderETH.setPrice(100e8)

      await OperationalTreasury.connect(deployer).withdraw(
        alice.address,
        99500e6,
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, 900e6)

      expect(await OperationalTreasury.totalBalance()).to.be.eq(
        await OperationalTreasury.benchmark(),
      )
    })

    it("should set setBenchmark", async () => {
      const {
        OperationalTreasury,
        CoverPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const newBenchmark = 100e6
      await expect(
        OperationalTreasury.connect(alice).setBenchmark(newBenchmark),
      ).to.be.reverted //check access
      await OperationalTreasury.connect(deployer).setBenchmark(newBenchmark)
      expect(await OperationalTreasury.benchmark()).to.be.eq(newBenchmark)
    })
  })
})
