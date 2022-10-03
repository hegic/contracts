import {ethers, deployments, timeAndMine} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
// import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicCouponPool} from "../../typechain/HegicCouponPool"
import {Erc20Mock} from "../../typechain/Erc20Mock"

const {expect} = chai //.use(solidity)

describe("hegic coupon pool", async () => {
  let deployer: Signer
  let alice: Signer
  let hcp: HegicCouponPool
  let USDC: Erc20Mock

  beforeEach(async () => {
    // await deployments.fixture("HCP")
    await deployments.fixture()
    ;[deployer, alice] = await ethers.getSigners()
    hcp = (await ethers.getContract("HegicCouponPool")) as HegicCouponPool
    USDC = (await ethers.getContract("USDC")) as Erc20Mock
  })

  describe("constructor & settings", () => {
    it("should set all initial state", async () => {
      const receipient = await hcp.undistributedCouponRecipient()
      expect(receipient).to.equal(await deployer.getAddress())
    })
  })

  describe("initNewCoupon", () => {
    beforeEach(async () => {
      await USDC.mint(await deployer.getAddress(), 10_000e6)
      await USDC.approve(hcp.address, 10_000e6)
    })

    it("shouldn't init new coupon from alice", async () => {
      const start = Math.floor((Date.now() + 24 * 3600 * 3) / 1000)
      const amount = ethers.utils.parseUnits("1000000", 6)
      const coupon = 10_000e6
      const action = hcp.connect(alice).initNewCoupon(start, amount, coupon)
      await expect(action).to.be.revertedWith(
        `AccessControl: account ${(
          await alice.getAddress()
        ).toLowerCase()} is missing ` +
          `role 0x0000000000000000000000000000000000000000000000000000000000000000`,
      )
    })

    it("should correctly init new coupon from deployer", async () => {
      const start = Math.floor((Date.now() + 24 * 3600 * 3 * 1000) / 1000)
      const amount = ethers.utils.parseUnits("1000000", 6)
      const coupon = 10_000
      await hcp.initNewCoupon(start, amount, coupon)

      const c = await hcp.coupons(0)

      expect(c.start).to.equal(start)
      expect(c.amount).to.equal(amount)
      expect(c.coupon).to.equal(coupon)
      expect(c.state).to.equal(1)
      expect(c.deposited).to.equal(0)
    })
  })

  describe("provideLiquidity", () => {
    beforeEach(async () => {
      await USDC.mint(await deployer.getAddress(), 20_000e6)
      await USDC.mint(hcp.address, 20_000e6)
      await USDC.approve(hcp.address, 20_000e6)

      await USDC.mint(await alice.getAddress(), 2_000_000e6)
      await USDC.connect(alice).approve(hcp.address, 2_000_000e6)
    })

    it("should provide liquidity", async () => {
      const start = Math.floor((Date.now() + 24 * 3600 * 3 * 1000) / 1000)
      const amount = ethers.utils.parseUnits("1000000", 6)
      const coupon = 10_000

      await hcp.initNewCoupon(start, amount, coupon)

      await hcp.connect(alice).provideLiquidity(0, 300000e6)
      const {provided, hasCoupon} = await hcp.provided(
        0,
        await alice.getAddress(),
      )
      expect(provided).to.be.equal(300000e6)
      expect(hasCoupon).to.be.equal(true)
    })

    it("should provide liquidity in different coupons correctly", async () => {
      const start = Math.floor((Date.now() + 24 * 3600 * 3 * 1000) / 1000)
      const amount = ethers.utils.parseUnits("1000000", 6)
      const coupon = 10_000

      await hcp.initNewCoupon(start, amount, coupon)
      await hcp.initNewCoupon(start, amount, coupon)

      await hcp.connect(alice).provideLiquidity(0, 300000e6)
      await hcp.connect(alice).provideLiquidity(1, 100000e6)
      const providedTo0 = (await hcp.provided(0, await alice.getAddress()))
        .provided
      const providedTo1 = (await hcp.provided(1, await alice.getAddress()))
        .provided
      expect(providedTo0).to.be.equal(300000e6)
      expect(providedTo1).to.be.equal(100000e6)
    })

    // it("should closeSubscription after all funds have been deposited", async () => {
    //   const start = Math.floor((Date.now() + 24 * 3600 * 2) / 1000)
    //   const amount = ethers.utils.parseUnits("1000000", 6)
    //   const coupon = ethers.utils.parseUnits("10000", 6)

    //   await hcp.initNewCoupon(start, amount, coupon)

    //   const action = hcp.connect(alice).provideLiquidity(0, 1_000_000e6)
    //   await expect(action).to.emit(hcp, "SubscriptionClosed").withArgs(0)

    //   const c = await hcp.coupons(0)
    //   await expect(action)
    //     .to.emit(USDC, "Transfer")
    //     .withArgs(
    //       hcp.address,
    //       await deployer.getAddress(),
    //       coupon.sub(c.coupon),
    //     )
    // })

    //   it("should closeSubscription after all funds have been deposited", async () => {
    //     const start = Math.floor(Date.now() / 1000 + 24 * 3600 * 2)
    //     const amount = ethers.utils.parseUnits("1000000", 6)
    //     const coupon = ethers.utils.parseUnits("10000", 6)

    //     await hcp.initNewCoupon(start, amount, coupon)

    //     const actionProvide = hcp.connect(alice).provideLiquidity(0, 1_000_000e6)
    //     await actionProvide
    //     // await expect(actionProvide)
    //     const c = await hcp.coupons(0)
    //     await expect(actionProvide)
    //       .to.emit(hcp, "SubscriptionClosed")
    //       .withArgs(0)
    //       .to.emit(USDC, "Transfer")
    //       .withArgs(
    //         hcp.address,
    //         await deployer.getAddress(),
    //         coupon.sub(c.coupon),
    //       )

    //     await timeAndMine.setTime(start + 1)
    //     await hcp.claim(0, await alice.getAddress())
    //   })
  })

  describe("withdrawLiquidity", () => {
    beforeEach(async () => {
      await USDC.mint(await deployer.getAddress(), 20_000e6)
      await USDC.approve(hcp.address, 20_000e6)

      await USDC.connect(alice).mint(await alice.getAddress(), 2_000_000e6)
      await USDC.connect(alice).approve(hcp.address, 2_000_000e6)
    })

    it("should be able to withdraw liquidity after the coupon is closed", async () => {
      const start = Math.floor(Date.now() / 1000 + 24 * 3600 * 2)
      const amount = ethers.utils.parseUnits("1000000", 6)
      const coupon = ethers.utils.parseUnits("10000", 6)

      await hcp.initNewCoupon(start, amount, coupon)

      const actionProvide = hcp.connect(alice).provideLiquidity(0, 1_000_000e6)
      await actionProvide
      // await expect(actionProvide)
      const c = await hcp.coupons(0)
      await expect(actionProvide)
        .to.emit(hcp, "SubscriptionClosed")
        .withArgs(0)
        .to.emit(USDC, "Transfer")
        .withArgs(
          hcp.address,
          await deployer.getAddress(),
          coupon.sub(c.coupon),
        )

      await timeAndMine.setTime(start + 1)
      await hcp.claim(0, await alice.getAddress())

      // const end = (await ethers.provider.getBlock("latest")).timestamp

      await timeAndMine.setTime(start + 30 * 24 * 3600 + 1)

      const actionWithdraw = hcp.withdrawLiquidity(0, await alice.getAddress())

      await expect(actionWithdraw)
        .emit(USDC, "Transfer")
        .withArgs(hcp.address, await alice.getAddress(), 1_000_000e6)
    })
  })
})
