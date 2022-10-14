import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes} from "ethers/lib/utils"
import {constants} from "ethers"
import {timeAndMine, ethers as e2} from "hardhat"
import pricers from "../../deploy/01_price_providers"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000"
const OPTInitialBalance = parseUnits("100000", 6)

describe("Operational Pool", () => {
  let testData: Fixture

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
      strategies,
      pricers,
    } = (testData = await fixture())

    await CoverPool.grantRole(DEFAULT_ADMIN_ROLE, carl.address)

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

    await OptionsManager.grantRole(
      await OptionsManager.HEGIC_POOL_ROLE(),
      OperationalTreasury.address,
    )

    await USDC.mint(OperationalTreasury.address, OPTInitialBalance)
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

    const x = await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_100_ETH.address,
      alice.address,
      amount,
      period,
      [],
    )
  })

  describe("Operational Treasury (OPT)", () => {
    it("should lock USDC into Operational Treasury", async () => {
      const {OperationalTreasury, strategies, BasePriceCalculator_PUT_ETH} =
        testData
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
      const {OperationalTreasury} = testData

      const position = await OperationalTreasury.lockedLiquidity(0)

      await timeAndMine.setTimeIncrease("8d")
      await OperationalTreasury.unlock(0)

      expect(await OperationalTreasury.totalLocked()).to.be.eq(0)
      expect(await OperationalTreasury.totalBalance()).to.be.eq(
        OPTInitialBalance.add(position.positivepnl),
      )
    })

    it("should send USDC to the option holder when option is exercised", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
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
        signers: [deployer, alice, ,],
        USDC,
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
        signers: [deployer, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const newPrice = parseUnits("100", 8)
      await PriceProviderETH.setPrice(newPrice)
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
        signers: [deployer, alice, ,],
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
