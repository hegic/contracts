import {ethers, deployments, timeAndMine} from "hardhat"
import {BigNumber as BN, BigNumberish} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {Erc20Mock as ERC20} from "../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../typechain/HegicOperationalTreasury"
import {HegicStakeAndCover} from "../typechain/HegicStakeAndCover"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["operational-treasury"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    HEGIC: (await ethers.getContract("HEGIC")) as ERC20,
    HegicOperationalTreasury: (await ethers.getContract(
      "HegicOperationalTreasury",
    )) as HegicOperationalTreasury,
    HegicStakeAndCover: (await ethers.getContract(
      "HegicStakeAndCover",
    )) as HegicStakeAndCover,
  }
})

describe("HegicOperationalTreasury", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>
  const insuranceAmount = ethers.utils.parseUnits("900000", 6)
  const stakingAmount = ethers.utils.parseUnits("90000000", 18)

  const expectPoolStateIs = (expected: {
    totalBalance: BigNumberish
    lockedPremium: BigNumberish
    totalLocked: BigNumberish
    realBalance: BigNumberish
  }) =>
    Promise.all([
      contracts.HegicOperationalTreasury.totalBalance(),
      contracts.HegicOperationalTreasury.lockedPremium(),
      contracts.HegicOperationalTreasury.totalLocked(),
      contracts.USDC.balanceOf(contracts.HegicOperationalTreasury.address),
    ]).then(([totalBalance, lockedPremium, totalLocked, realBalance]) => {
      expect(totalBalance).eq(expected.totalBalance)
      expect(lockedPremium).eq(expected.lockedPremium)
      expect(totalLocked).eq(expected.totalLocked)
      expect(realBalance).eq(expected.realBalance)
    })

  beforeEach(async () => {
    contracts = await fixture()
    const {alice, HegicStakeAndCover} = contracts

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits(
        "1000000000000000",
        await contracts.USDC.decimals(),
      ),
    )

    await contracts.HEGIC.mint(HegicStakeAndCover.address, stakingAmount)
    await contracts.USDC.mint(HegicStakeAndCover.address, insuranceAmount)
    await HegicStakeAndCover.saveFreeTokens()
  })

  describe("constructor", () => {})

  describe("withdraw", () => {})

  describe("replenish, withdraw", async () => {
    const startBalance = ethers.utils.parseUnits("100000", 6)
    const startHBalance = ethers.utils.parseUnits("10000000", 18)
    beforeEach(async () => {
      await contracts.USDC.mint(
        contracts.HegicOperationalTreasury.address,
        startBalance,
      )
      await contracts.HegicOperationalTreasury.addTokens()
      await contracts.HegicOperationalTreasury.grantRole(
        await contracts.HegicOperationalTreasury.STRATEGY_ROLE(),
        await contracts.deployer.getAddress(),
      )
    })

    it("Should send USDC from InsurancePool when currentBalance < startBalance", async () => {
      const {HegicOperationalTreasury, deployer, USDC} = contracts
      const premium = ethers.utils.parseUnits("10000", 6)
      const lockAmount = ethers.utils.parseUnits("10000", 6)
      const expiration = Math.floor(Date.now() / 1000) + 24 * 3600
      const profit = ethers.utils.parseUnits("70000", 6)

      await USDC.mint(HegicOperationalTreasury.address, premium)
      await HegicOperationalTreasury.lockLiquidityFor(
        await deployer.getAddress(),
        lockAmount,
        expiration,
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: premium,
        totalLocked: lockAmount,
        realBalance: startBalance.add(premium),
      })

      await HegicOperationalTreasury.payOff(
        0,
        profit,
        await deployer.getAddress(),
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium).sub(profit),
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: startBalance.add(premium).sub(profit),
      })

      await HegicOperationalTreasury.connect(deployer).replenish()

      await expectPoolStateIs({
        totalBalance: startBalance,
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: startBalance,
      })
    })

    it("Should withdraw USDC", async () => {
      const {HegicOperationalTreasury, HegicStakeAndCover, deployer, USDC} =
        contracts
      const premium = ethers.utils.parseUnits("10000", 6)
      const lockAmount = ethers.utils.parseUnits("10000", 6)
      const expiration = Math.floor(Date.now() / 1000) + 24 * 3600

      await USDC.mint(HegicOperationalTreasury.address, premium)
      await HegicOperationalTreasury.lockLiquidityFor(
        await deployer.getAddress(),
        lockAmount,
        expiration,
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: premium,
        totalLocked: lockAmount,
        realBalance: startBalance.add(premium),
      })

      await timeAndMine.setTime(expiration + 1)
      await HegicOperationalTreasury.unlock(0)

      await HegicOperationalTreasury.connect(deployer).withdraw(
        HegicStakeAndCover.address,
        premium,
      )

      await expectPoolStateIs({
        totalBalance: startBalance,
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: startBalance,
      })
    })
  })

  describe("lockLiquidityFor", () => {
    const startBalance = ethers.utils.parseUnits("100000", 6)
    beforeEach(async () => {
      await contracts.USDC.mint(
        contracts.HegicOperationalTreasury.address,
        startBalance,
      )
      await contracts.HegicOperationalTreasury.addTokens()
      await contracts.HegicOperationalTreasury.grantRole(
        await contracts.HegicOperationalTreasury.STRATEGY_ROLE(),
        await contracts.deployer.getAddress(),
      )
    })

    it("should lock liquidity correctly", async () => {
      const {HegicOperationalTreasury, deployer, USDC} = contracts
      const premium = ethers.utils.parseUnits("100", 6)
      const lockAmount = ethers.utils.parseUnits("1000", 6)
      const expiration = Math.floor(Date.now() / 1000) + 24 * 3600

      await USDC.mint(HegicOperationalTreasury.address, premium)
      await HegicOperationalTreasury.lockLiquidityFor(
        await deployer.getAddress(),
        lockAmount,
        expiration,
      )
      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: premium,
        totalLocked: lockAmount,
        realBalance: startBalance.add(premium),
      })
    })
  })

  describe("unlock", () => {
    const startBalance = ethers.utils.parseUnits("100000", 6)
    beforeEach(async () => {
      await contracts.USDC.mint(
        contracts.HegicOperationalTreasury.address,
        startBalance,
      )
      await contracts.HegicOperationalTreasury.addTokens()
      await contracts.HegicOperationalTreasury.grantRole(
        await contracts.HegicOperationalTreasury.STRATEGY_ROLE(),
        await contracts.deployer.getAddress(),
      )
    })

    it("should unlock liquidity correctly", async () => {
      const {HegicOperationalTreasury, deployer, USDC} = contracts
      const premium = ethers.utils.parseUnits("100", 6)
      const lockAmount = ethers.utils.parseUnits("1000", 6)
      const expiration = Math.floor(Date.now() / 1000) + 24 * 3600

      await USDC.mint(HegicOperationalTreasury.address, premium)
      await HegicOperationalTreasury.lockLiquidityFor(
        await deployer.getAddress(),
        lockAmount,
        expiration,
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: premium,
        totalLocked: lockAmount,
        realBalance: startBalance.add(premium),
      })

      await timeAndMine.setTime(expiration + 1)
      await HegicOperationalTreasury.unlock(0)

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: startBalance.add(premium),
      })
    })
  })

  describe("payOff", () => {
    const startBalance = ethers.utils.parseUnits("100000", 6)
    beforeEach(async () => {
      await contracts.USDC.mint(
        contracts.HegicOperationalTreasury.address,
        startBalance,
      )
      await contracts.HegicOperationalTreasury.addTokens()
      await contracts.HegicOperationalTreasury.grantRole(
        await contracts.HegicOperationalTreasury.STRATEGY_ROLE(),
        await contracts.deployer.getAddress(),
      )
      // await contracts.Ins
    })

    it("should set all balances correctly", async () => {
      const {HegicOperationalTreasury, deployer, USDC} = contracts
      const premium = ethers.utils.parseUnits("100", 6)
      const lockAmount = ethers.utils.parseUnits("1000", 6)
      const expiration = Math.floor(Date.now() / 1000) + 24 * 3600
      const profit = ethers.utils.parseUnits("1300", 6)

      await USDC.mint(HegicOperationalTreasury.address, premium)
      await HegicOperationalTreasury.lockLiquidityFor(
        await deployer.getAddress(),
        lockAmount,
        expiration,
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: premium,
        totalLocked: lockAmount,
        realBalance: startBalance.add(premium),
      })

      await HegicOperationalTreasury.payOff(
        0,
        profit,
        await deployer.getAddress(),
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium).sub(profit),
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: startBalance.add(premium).sub(profit),
      })
    })

    it("should set all balances correctly (insurance)", async () => {
      const {HegicOperationalTreasury, deployer, USDC} = contracts
      const premium = ethers.utils.parseUnits("35000", 6)
      const lockAmount = ethers.utils.parseUnits("70000", 6)
      const expiration = Math.floor(Date.now() / 1000) + 24 * 3600
      const profit = ethers.utils.parseUnits("170000", 6)

      await USDC.mint(HegicOperationalTreasury.address, premium)
      await HegicOperationalTreasury.lockLiquidityFor(
        await deployer.getAddress(),
        lockAmount,
        expiration,
      )

      await expectPoolStateIs({
        totalBalance: startBalance.add(premium),
        lockedPremium: premium,
        totalLocked: lockAmount,
        realBalance: startBalance.add(premium),
      })

      expect(
        await USDC.balanceOf(contracts.HegicStakeAndCover.address),
      ).to.be.eq(insuranceAmount)
      await HegicOperationalTreasury.payOff(
        0,
        profit,
        await deployer.getAddress(),
      )

      await expectPoolStateIs({
        totalBalance: startBalance,
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: startBalance,
      })

      expect(
        await USDC.balanceOf(contracts.HegicStakeAndCover.address),
      ).to.be.eq(insuranceAmount.add(premium).sub(profit))
    })
  })

  describe("addTokens", () => {
    it("should save free liquidity to totalBalance", async () => {
      const provideAmount = ethers.utils.parseUnits("100000", 6)

      await expectPoolStateIs({
        totalBalance: BN.from(0),
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: BN.from(0),
      })

      await contracts.USDC.mint(
        contracts.HegicOperationalTreasury.address,
        provideAmount,
      )

      await expectPoolStateIs({
        totalBalance: BN.from(0),
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: provideAmount,
      })

      await contracts.HegicOperationalTreasury.addTokens()

      await expectPoolStateIs({
        totalBalance: provideAmount,
        lockedPremium: BN.from(0),
        totalLocked: BN.from(0),
        realBalance: provideAmount,
      })
    })
  })
})
