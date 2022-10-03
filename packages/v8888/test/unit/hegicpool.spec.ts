import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicPool} from "../../typechain/HegicPool"
import {WethMock} from "../../typechain/WethMock"
import {IvlPriceCalculator} from "../../typechain/IvlPriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"

chai.use(solidity)
const {expect} = chai

describe("HegicPool", async () => {
  let hegicPool: HegicPool
  let WETH: WethMock
  let deployer: Signer
  let alice: Signer
  let bob: Signer
  let pricer: IvlPriceCalculator
  let ethPriceFeed: AggregatorV3Interface

  beforeEach(async () => {
    await deployments.fixture()
    ;[deployer, alice, bob] = await ethers.getSigners()
    alice
    WETH = (await ethers.getContract("WETH")) as WethMock
    pricer = (await ethers.getContract(
      "ETHCallPriceCalculator",
    )) as IvlPriceCalculator
    hegicPool = (await ethers.getContract("HegicWETHCALL")) as HegicPool
    ethPriceFeed = (await ethers.getContract(
      "ETHPriceProvider",
    )) as AggregatorV3Interface

    await WETH.connect(alice).deposit({value: BN.from(10).pow(20)})
    await WETH.connect(alice).approve(
      hegicPool.address,
      ethers.constants.MaxUint256,
    )
  })

  describe("constructor & settings", async () => {
    it("should set all initial state", async () => {
      expect(await hegicPool.INITIAL_RATE()).to.be.eq(BN.from(10).pow(20))
      expect(await hegicPool.lockupPeriodForHedgedTranches()).to.be.eq(
        BN.from(5184000),
      )
      expect(await hegicPool.lockupPeriodForUnhedgedTranches()).to.be.eq(
        BN.from(2592000),
      )
      expect(await hegicPool.hedgeFeeRate()).to.be.eq(BN.from(80))
      expect(await hegicPool.lockedAmount()).to.be.eq(BN.from(0))
      expect(await hegicPool.unhedgedShare()).to.be.eq(BN.from(0))
      expect(await hegicPool.hedgedShare()).to.be.eq(BN.from(0))
      expect(await hegicPool.unhedgedBalance()).to.be.eq(BN.from(0))
      expect(await hegicPool.hedgedBalance()).to.be.eq(BN.from(0))
      expect(await hegicPool.hedgePool()).to.be.eq(
        BN.from(await deployer.getAddress()),
      )
      expect(await hegicPool.token()).to.be.eq(WETH.address)
    })
  })

  describe("setLockupPeriod", async () => {
    it("should revert if the caller is not the HegicOptions", async () => {
      await expect(
        hegicPool.connect(alice).setLockupPeriod(10, 10),
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })

    it("should revert if the period is greater than 60 days", async () => {
      await expect(
        hegicPool.setLockupPeriod(BN.from(5184001), 0),
      ).to.be.revertedWith("The lockup period for hedged tranches is too long")
      await expect(
        hegicPool.setLockupPeriod(0, BN.from(5184001)),
      ).to.be.revertedWith(
        "The lockup period for unhedged tranches is too long",
      )
    })

    it("should set the lockupPeriod correctly", async () => {
      const lockupPeriodBeforeH =
        await hegicPool.lockupPeriodForHedgedTranches()
      const lockupPeriodBeforeU =
        await hegicPool.lockupPeriodForUnhedgedTranches()
      expect(lockupPeriodBeforeH).to.equal(BN.from(5184000))
      expect(lockupPeriodBeforeU).to.equal(BN.from(2592000))
      await hegicPool.setLockupPeriod(5183001, 2123000)
      const lockupPeriodAfterH = await hegicPool.lockupPeriodForHedgedTranches()
      const lockupPeriodAfterU =
        await hegicPool.lockupPeriodForUnhedgedTranches()
      expect(lockupPeriodAfterH).to.be.eq(BN.from(5183001))
      expect(lockupPeriodAfterU).to.be.eq(BN.from(2123000))
    })
  })

  describe("setMaxDepositAmount", async () => {
    it("should revert if the amount of the deposit exceeds the zero limit", async () => {
      await hegicPool.setMaxDepositAmount(0, 0)
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      const provide = hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        false,
        0,
      )
      await expect(provide).to.be.revertedWith(
        "Pool Error: Depositing into the pool is not available",
      )
    })

    it("should revert if the amount of the deposit exceeds the limit", async () => {
      const limit = ethers.utils.parseUnits("5")
      await hegicPool.setMaxDepositAmount(limit, limit)
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("4"),
        false,
        0,
      )
      const provide = hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("1").add(1),
        false,
        0,
      )
      await expect(provide).to.be.revertedWith(
        "Pool Error: Depositing into the pool is not available",
      )
    })

    it("should revert if the amount of the hedged deposit exceeds the zero limit", async () => {
      await hegicPool.setMaxDepositAmount(ethers.constants.MaxUint256, 0)
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      const provide = hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        true,
        0,
      )
      await expect(provide).to.be.revertedWith(
        "Pool Error: Depositing into the pool is not available",
      )
      hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        false,
        0,
      )
    })

    it("should revert if the amount of the hedged deposit exceeds the limit", async () => {
      const limit = ethers.utils.parseUnits("5")
      await hegicPool.setMaxDepositAmount(ethers.constants.MaxUint256, limit)
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("4"),
        true,
        0,
      )
      const provide = hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("1").add(1),
        true,
        0,
      )
      await expect(provide).to.be.revertedWith(
        "Pool Error: Depositing into the pool is not available",
      )
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("6"),
        false,
        0,
      )
    })
  })

  describe("setMaxUtilizationRate", async () => {
    beforeEach(async () => {
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        false,
        0,
      )
    })
    ;[50, 60, 70, 80, 90, 100].forEach((x) =>
      it("should set maxUtilizationRate correctly", async () => {
        await hegicPool.setMaxUtilizationRate(x)
        const cr = await hegicPool.collateralizationRatio()
        const maxAmount = ethers.utils
          .parseUnits(`${x / 10}`)
          .mul(100)
          .div(cr)
        const selling = hegicPool
          .connect(alice)
          .sellOption(await alice.getAddress(), 1209600, maxAmount.add(5), 0)
        await expect(selling).to.be.revertedWith(
          "Pool Error: The amount is too large",
        )
        await hegicPool
          .connect(alice)
          .sellOption(await alice.getAddress(), 1209600, maxAmount, 0)
      }),
    )

    it("shouldn't set too small maxUtilizationRate", async () => {
      await expect(hegicPool.setMaxUtilizationRate(49)).to.be.revertedWith(
        "Pool error: Wrong utilization rate limitation value",
      )
    })

    it("shouldn't set too large maxUtilizationRate", async () => {
      await expect(hegicPool.setMaxUtilizationRate(101)).to.be.revertedWith(
        "Pool error: Wrong utilization rate limitation value",
      )
    })
  })

  describe("setCollateralizationRatio", async () => {
    it("shouldn't set too small collateralizationRatio", async () => {
      await expect(hegicPool.setCollateralizationRatio(29)).to.be.revertedWith(
        "Pool Error: Wrong collateralization ratio value",
      )
    })
    it("shouldn't set too large collateralizationRatio", async () => {
      await expect(hegicPool.setCollateralizationRatio(101)).to.be.revertedWith(
        "Pool Error: Wrong collateralization ratio value",
      )
    })
    it("should set collateralizationRatio", async () => {
      for (const i of [30, 40, 50, 60, 70, 80, 90, 100]) {
        await hegicPool.setCollateralizationRatio(i)
        expect(await hegicPool.collateralizationRatio()).to.be.eq(i)
      }
    })
    it("should take collateralizationRatio into account", async () => {
      await hegicPool.setCollateralizationRatio(50)
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        false,
        0,
      )

      await WETH.connect(alice).deposit({
        value: ethers.utils.parseUnits("10", 18),
      })

      await WETH.connect(alice).approve(
        hegicPool.address,
        ethers.constants.MaxUint256,
      )
      const selling = hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("16").add(2),
          0,
        )
      await expect(selling).to.be.revertedWith(
        "Pool Error: The amount is too large",
      )
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("16"),
          0,
        )
    })
  })

  describe("setHedgePool", async () => {
    it("should revert if the caller is not the admin", async () => {
      await expect(
        hegicPool.connect(alice).setHedgePool(await alice.getAddress()),
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })

    it("should revert if the address is the zero address", async () => {
      await expect(hegicPool.setHedgePool(ethers.constants.AddressZero)).to.be
        .reverted
    })

    it("should set the hedgePool correctly", async () => {
      const hedgePoolBefore = await hegicPool.hedgePool()
      expect(hedgePoolBefore).to.equal(await deployer.getAddress())
      await hegicPool.setHedgePool(await alice.getAddress())
      const hedgePoolAfter = await hegicPool.hedgePool()
      expect(hedgePoolAfter).to.be.eq(await alice.getAddress())
    })
  })

  describe("setSettlementFeeRecipient", async () => {
    it("should revert if the caller is not the owner", async () => {
      await expect(
        hegicPool
          .connect(alice)
          .setSettlementFeeRecipient(await alice.getAddress()),
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })

    it("should revert if zero address is given for recipient", async () => {
      await expect(
        hegicPool.setSettlementFeeRecipient(ethers.constants.AddressZero),
      ).to.be.reverted
    })

    it("should update the settlement fee recipients", async () => {
      await hegicPool.setSettlementFeeRecipient(await alice.getAddress())

      expect(await hegicPool.settlementFeeRecipient()).to.eq(
        await alice.getAddress(),
      )
    })
  })

  describe("setPriceCalculator", async () => {
    it("should revert if the caller is not the owner", async () => {
      await expect(
        hegicPool.connect(alice).setPriceCalculator(pricer.address),
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
      )
    })

    it("should update the priceCalculator correctly", async () => {
      const priceCalculatorBefore = await hegicPool.pricer()
      expect(priceCalculatorBefore).to.be.eq(pricer.address)
      await hegicPool.setPriceCalculator(await alice.getAddress())
      const priceCalculatorAfter = await hegicPool.pricer()
      expect(priceCalculatorAfter).to.be.eq(await alice.getAddress())
    })
  })

  describe("sellOption", async () => {
    const hedgeFeeTests = [
      ["0", "10"],
      ["3", "7"],
      ["7", "3"],
      ["10", "0"],
    ]

    beforeEach(async () => {
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("3"),
        false,
        0,
      )
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("7"),
        true,
        0,
      )
    })

    it("should revert if the strike is less than 1 day", async () => {
      await expect(
        hegicPool
          .connect(alice)
          .sellOption(
            await alice.getAddress(),
            1,
            1,
            await ethPriceFeed.latestRoundData().then((x) => x.answer),
          ),
      ).to.be.revertedWith("Pool Error: The period is too short")
    })

    it("should revert if the strike is greater than 12 weeks", async () => {
      // Test for 13 weeks
      await expect(
        hegicPool
          .connect(alice)
          .sellOption(
            await alice.getAddress(),
            7862400,
            1,
            await ethPriceFeed.latestRoundData().then((x) => x.answer),
          ),
      ).to.be.revertedWith("Pool Error: The period is too long")
    })

    it("should set the strike to the current price if 0 is given", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          0,
        )
      const option = await hegicPool.options(BN.from(0))
      expect(option.strike).to.eq(
        await ethPriceFeed.latestRoundData().then((x) => x.answer),
      )
    })

    it("should create an option correctly", async () => {
      const amount = ethers.utils.parseUnits("1")
      await hegicPool
        .connect(alice)
        .sellOption(await alice.getAddress(), 1209600, amount, 0)
      const lockedForCall = amount.mul(50).div(100)
      const option = await hegicPool.options(BN.from(0))
      expect(option.state).to.eq(BN.from(1))
      expect(option.strike).to.eq(
        await ethPriceFeed.latestRoundData().then((x) => x.answer),
      )
      expect(option.amount).to.eq(amount)
      expect(option.lockedAmount).to.eq(lockedForCall)
    })

    // If the lockedAmount * 10 <= balance * 8 it should revert
    it("should revert if the locked amount is too large", async () => {
      await WETH.connect(alice).deposit({
        value: ethers.utils.parseUnits("10", 18),
      })

      await WETH.connect(alice).approve(
        hegicPool.address,
        ethers.constants.MaxUint256,
      )
      const selling = hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("16").add(2),
          0,
        )

      await expect(selling).to.be.revertedWith(
        "Pool Error: The amount is too large",
      )
    })

    hedgeFeeTests.forEach((x) =>
      it(`should transfer the hedge fee to the hedge pool correctly ${x}`, async () => {
        await hegicPool.setHedgePool(await bob.getAddress())
        const hedgePool = await hegicPool.hedgePool()
        const balanceBefore = await WETH.balanceOf(hedgePool)
        // const premium = BN.from(1e6)

        await WETH.deposit({value: ethers.utils.parseUnits("10")})
        await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
        if (x[0] != "0")
          await hegicPool.provideFrom(
            await deployer.getAddress(),
            ethers.utils.parseUnits(x[0]),
            true,
            0,
          )
        if (x[1] != "0")
          await hegicPool.provideFrom(
            await deployer.getAddress(),
            ethers.utils.parseUnits(x[1]),
            false,
            0,
          )

        const amount = ethers.utils.parseUnits("1")
        const strike = await ethPriceFeed
          .latestRoundData()
          .then((x) => x.answer)
        const {premium} = await pricer.calculateTotalPremium(
          1209600,
          amount,
          strike,
        )

        await hegicPool
          .connect(alice)
          .sellOption(await alice.getAddress(), 1209600, amount, strike)

        const poolTotalBalance = await hegicPool.totalBalance()
        const poolHedgedBalance = await hegicPool.hedgedBalance()
        const poolHedgeFeeRate = await hegicPool.hedgeFeeRate()

        const hedgePremium = premium
          .mul(poolHedgedBalance)
          .div(poolTotalBalance)

        const expectedHedgeFee = hedgePremium
          .mul(poolHedgeFeeRate)
          .div(BN.from(100))

        const balanceAfter = await WETH.balanceOf(hedgePool)
        expect(balanceAfter.sub(balanceBefore)).to.equal(expectedHedgeFee)
      }),
    )

    it("should emit a Create event with correct values", async () => {
      const {settlementFee, premium} = await pricer.calculateTotalPremium(
        1209600,
        ethers.utils.parseUnits("1"),
        await ethPriceFeed.latestRoundData().then((x) => x.answer),
      )
      await expect(
        hegicPool
          .connect(alice)
          .sellOption(
            await alice.getAddress(),
            1209600,
            ethers.utils.parseUnits("1"),
            await ethPriceFeed.latestRoundData().then((x) => x.answer),
          ),
      )
        .to.emit(hegicPool, "Acquired")
        .withArgs(BN.from(0), settlementFee, premium)
    })
  })

  describe("exercise", async () => {
    beforeEach(async () => {
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        false,
        0,
      )

      await WETH.connect(alice).deposit({
        value: ethers.utils.parseUnits("10", 18),
      })
      await WETH.connect(alice).approve(
        hegicPool.address,
        ethers.constants.MaxUint256,
      )
    })

    it("should revert if the option exerciser is not approved or the owner", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      await ethPriceFeed.setPrice(2600e8)
      await expect(
        hegicPool.connect(bob).exercise(BN.from(0)),
      ).to.be.revertedWith("Pool Error: msg.sender can't exercise this option")
    })

    it("should revert if the option has expired", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      // Move forward 360 days
      await ethers.provider.send("evm_increaseTime", [
        BN.from(31104000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])

      await ethPriceFeed.setPrice(2600e8)

      await expect(
        hegicPool.connect(alice).exercise(BN.from(0)),
      ).to.be.revertedWith("Pool Error: The option has already expired")
    })

    it("should set values correctly", async () => {
      // Premium = premium * hedgedBalance / balance
      // 10 * 10000 / 10000

      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          10000,
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )

      const lockedAmountBefore = await hegicPool.lockedAmount()
      expect(lockedAmountBefore).to.eq(BN.from(5000))

      // Move forward 360 days
      await ethers.provider.send("evm_increaseTime", [
        BN.from(31104000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await hegicPool.unlock(BN.from(0))

      const lockedAmountAfter = await hegicPool.lockedAmount()
      expect(lockedAmountAfter).to.eq(BN.from(0))
    })

    it("should revert if the option is in the wrong state", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      await ethPriceFeed.setPrice(2600e8)
      await hegicPool.connect(alice).exercise(BN.from(0))
      await expect(
        hegicPool.connect(alice).exercise(BN.from(0)),
      ).to.be.revertedWith(
        "Pool Error: The option with such an ID has already been exercised or expired",
      )
    })

    it("should set the option state to exercised", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      await ethPriceFeed.setPrice(2600e8)

      await hegicPool.connect(alice).exercise(BN.from(0))
      const option = await hegicPool.options(BN.from(0))
      expect(option.state).to.eq(BN.from(2))
    })

    it("should pay profits correctly for option", async () => {
      const amount = ethers.utils.parseUnits("1", await WETH.decimals())
      const strike = await ethPriceFeed.latestRoundData().then((x) => x.answer)
      const exercisePrice = BN.from(3000e8)

      await hegicPool
        .connect(alice)
        .sellOption(await alice.getAddress(), 1209600, amount, strike)

      await ethPriceFeed.setPrice(exercisePrice)

      const beforeBalance = await WETH.balanceOf(await alice.getAddress())

      await hegicPool
        .connect(alice)
        .exercise(0)
        .then((x) => x.wait())

      // const profit = tx?.events?.find((x) => x.event === "Exercise")?.args
      //   ?.profit as BN

      const afterBalance = await WETH.balanceOf(await alice.getAddress())
      const expectedProfit = amount
        .mul(exercisePrice.sub(strike))
        .div(exercisePrice)

      expect(expectedProfit)
        .to.equal(await hegicPool.profitOf(0), "Wrong profit")
        // .to.equal(profit, "Wrong profit")
        .to.equal(afterBalance.sub(beforeBalance), "Wrong calculated profit")
    })

    it("should emit a Exercised event with correct values", async () => {
      ethPriceFeed.setPrice(2550e8)
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      ethPriceFeed.setPrice(2600e8)
      await expect(hegicPool.connect(alice).exercise(BN.from(0)))
        .to.emit(hegicPool, "Exercised")
        .withArgs(
          BN.from(0),
          BN.from(50e8).mul(ethers.utils.parseUnits("1")).div(2600e8),
        )
    })
  })

  describe("unlock", async () => {
    beforeEach(async () => {
      await WETH.deposit({value: ethers.utils.parseUnits("10")})
      await WETH.approve(hegicPool.address, ethers.constants.MaxUint256)
      await WETH.connect(alice).deposit({
        value: ethers.utils.parseUnits("10", 18),
      })
      await WETH.connect(alice).approve(
        hegicPool.address,
        ethers.constants.MaxUint256,
      )
      await hegicPool.provideFrom(
        await deployer.getAddress(),
        ethers.utils.parseUnits("10"),
        false,
        0,
      )
    })
    it("should revert if the option has not expired", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )

      await expect(hegicPool.unlock(BN.from(0))).to.be.revertedWith(
        "Pool Error: The option has not expired yet",
      )
    })
    it("should revert if the option is not active", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      // Move forward 360 days
      await ethers.provider.send("evm_increaseTime", [
        BN.from(31104000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await hegicPool.unlock(BN.from(0))
      await expect(hegicPool.unlock(BN.from(0))).to.be.revertedWith(
        "Pool Error: The option with such an ID has already been exercised or expired",
      )
    })
    it("should set the option state to Expired", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      // Move forward 360 days
      await ethers.provider.send("evm_increaseTime", [
        BN.from(31104000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await hegicPool.unlock(BN.from(0))
      const option = await hegicPool.options(BN.from(0))
      expect(option.state).to.eq(BN.from(3))
    })
    it("should unlock liquidity from the pool", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      // Move forward 360 days
      await ethers.provider.send("evm_increaseTime", [
        BN.from(31104000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      const option = await hegicPool.options(BN.from(0))
      const liquidityAmount = option.lockedAmount
      const lockedBefore = await hegicPool.lockedAmount()
      await hegicPool.unlock(BN.from(0))
      const lockedAfter = await hegicPool.lockedAmount()
      expect(lockedBefore.sub(lockedAfter)).to.eq(liquidityAmount)
    })
    it("should emit an Expire event with correct values", async () => {
      await hegicPool
        .connect(alice)
        .sellOption(
          await alice.getAddress(),
          1209600,
          ethers.utils.parseUnits("1"),
          await ethPriceFeed.latestRoundData().then((x) => x.answer),
        )
      // Move forward 360 days
      await ethers.provider.send("evm_increaseTime", [
        BN.from(31104000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await expect(hegicPool.unlock(BN.from(0)))
        .to.emit(hegicPool, "Expired")
        .withArgs(BN.from(0))
    })
  })

  describe("provideFrom", async () => {
    it("should supply funds to the pool", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await deployer.getAddress(),
          BN.from(100000),
          true,
          BN.from(100000),
        )
      expect(await hegicPool.availableBalance()).to.eq(BN.from(100000))
    })

    it("should revert if the mintShare is too large", async () => {
      await expect(
        hegicPool
          .connect(alice)
          .provideFrom(
            await deployer.getAddress(),
            BN.from(10),
            true,
            BN.from(10).pow(50),
          ),
      ).to.be.revertedWith("Pool Error: The mint limit is too large")
    })

    it("should revert if the mint limit is too large", async () => {
      await expect(
        hegicPool
          .connect(alice)
          .provideFrom(
            await deployer.getAddress(),
            BN.from(0),
            true,
            BN.from(0),
          ),
      ).to.be.revertedWith("Pool Error: The amount is too small")
    })

    it("should set the Tranche values correctly", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await deployer.getAddress(),
          BN.from(100000),
          true,
          BN.from(100000),
        )
      const tranche = await hegicPool.tranches(BN.from(0))
      // Set by INITIAL_RATE
      expect(tranche.share).to.eq(BN.from(10).pow(25))
      expect(tranche.state).to.eq(BN.from(1))
      expect(tranche.amount).to.eq(BN.from(100000))
      expect(tranche.hedged).to.eq(true)
    })

    it("should set the Tranche values correctly when unhedged", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await deployer.getAddress(),
          BN.from(100000),
          false,
          BN.from(100000),
        )
      const tranche = await hegicPool.tranches(BN.from(0))
      // Set by INITIAL_RATE
      expect(tranche.share).to.eq(BN.from(10).pow(25))
      expect(tranche.state).to.eq(BN.from(1))
      expect(tranche.amount).to.eq(BN.from(100000))
      expect(tranche.hedged).to.eq(false)
    })

    it("should emit a Tranche Transfer(Mint) event with correct values when unhedged", async () => {
      await expect(
        hegicPool
          .connect(alice)
          .provideFrom(
            await deployer.getAddress(),
            BN.from(100000),
            false,
            BN.from(100000),
          ),
      )
        .to.emit(hegicPool, "Transfer")
        .withArgs(
          ethers.constants.AddressZero,
          await deployer.getAddress(),
          BN.from(0),
        )
    })
  })

  describe("availableBalance", async () => {
    it("should return the available balance", async () => {
      expect(await hegicPool.availableBalance()).to.eq(BN.from(0))
    })
  })

  describe("withdraw", async () => {
    it("should revert if the trancheID does not exist", async () => {
      await expect(hegicPool.withdraw(BN.from(0))).to.be.reverted
    })

    it("should revert if the sender is not approved or the owner", async () => {
      await expect(hegicPool.connect(alice).withdraw(BN.from(0))).to.be.reverted
    })

    it("should revert if the tranche is not in an open state", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await deployer.getAddress(),
          BN.from(100000),
          true,
          BN.from(100000),
        )
      await ethers.provider.send("evm_increaseTime", [
        BN.from(20000000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await hegicPool.withdraw(BN.from(0))
      await expect(hegicPool.withdraw(BN.from(0))).to.be.reverted
    })

    it("should revert when the pool withdrawal is locked", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await deployer.getAddress(),
          BN.from(100000),
          true,
          BN.from(100000),
        )

      await expect(hegicPool.withdraw(BN.from(0))).to.be.revertedWith(
        "Pool Error: The withdrawal is locked up",
      )
    })

    it("should transfer tokens to the owner of the tranche when hedged", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await alice.getAddress(),
          BN.from(100000),
          true,
          BN.from(100000),
        )
      await ethers.provider.send("evm_increaseTime", [
        BN.from(20000000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])

      const balanceBefore = await WETH.balanceOf(await alice.getAddress())
      expect(balanceBefore).to.equal(BN.from(10).pow(20).sub(100000))
      await hegicPool.connect(alice).withdraw(BN.from(0))
      const balanceAfter = await WETH.balanceOf(await alice.getAddress())
      expect(balanceAfter).to.equal(BN.from(balanceBefore).add(BN.from(100000)))
    })

    it("should transfer tokens to the owner of the tranche when unhedged", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(
          await alice.getAddress(),
          BN.from(100000),
          false,
          BN.from(100000),
        )
      await ethers.provider.send("evm_increaseTime", [
        BN.from(20000000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])

      const balanceBefore = await WETH.balanceOf(await alice.getAddress())
      expect(balanceBefore).to.equal(BN.from(10).pow(20).sub(100000))
      await hegicPool.connect(alice).withdraw(BN.from(0))
      const balanceAfter = await WETH.balanceOf(await alice.getAddress())
      expect(balanceAfter).to.equal(BN.from(balanceBefore).add(BN.from(100000)))
    })

    it("should emit a Withdraw event with correct values", async () => {
      await hegicPool
        .connect(alice)
        .provideFrom(await deployer.getAddress(), 100000, true, 100000)

      await ethers.provider.send("evm_increaseTime", [
        BN.from(20000000).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])

      await expect(hegicPool.withdraw(BN.from(0)))
        .to.emit(hegicPool, "Withdrawn")
        .withArgs(await deployer.getAddress(), 0, 100000)
    })
  })

  describe("withdrawWithoutHedge", async () => {
    it("should revert if the trancheID does not exist", async () => {
      await expect(hegicPool.withdrawWithoutHedge(BN.from(0))).to.be.reverted
    })

    it("should revert when the sender is not approved or the owner", async () => {
      await expect(hegicPool.connect(alice).withdrawWithoutHedge(BN.from(0))).to
        .be.reverted
    })
  })

  describe("totalBalance", async () => {
    it("should return the total balance", async () => {
      expect(await hegicPool.totalBalance()).to.eq(BN.from(0))
    })
  })
})
