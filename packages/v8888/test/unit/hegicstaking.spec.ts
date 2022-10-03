import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStaking} from "../../typechain/HegicStaking"
import {Erc20Mock} from "../../typechain/Erc20Mock"

chai.use(solidity)
const {expect} = chai

describe("HegicStaking", async () => {
  let hegicStaking: HegicStaking
  let fakeHegic: Erc20Mock
  let fakeWBTC: Erc20Mock
  let deployer: Signer
  let alice: Signer
  let bob: Signer

  beforeEach(async () => {
    await deployments.fixture()
    ;[deployer, alice, bob] = await ethers.getSigners()

    fakeWBTC = (await ethers.getContract("WBTC")) as Erc20Mock
    fakeHegic = (await ethers.getContract("HEGIC")) as Erc20Mock
    hegicStaking = (await ethers.getContract("WBTCStaking")) as HegicStaking

    await fakeHegic.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("888000", await fakeHegic.decimals()),
    )
    await fakeHegic.mint(
      await bob.getAddress(),
      ethers.utils.parseUnits("888000", await fakeHegic.decimals()),
    )
    await fakeWBTC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
    )

    await fakeHegic
      .connect(alice)
      .approve(hegicStaking.address, ethers.constants.MaxUint256)

    await fakeHegic
      .connect(bob)
      .approve(hegicStaking.address, ethers.constants.MaxUint256)
  })

  describe("constructor & settings", () => {
    it("should set all initial state", async () => {
      expect(await hegicStaking.HEGIC()).to.be.eq(fakeHegic.address)
      expect(await hegicStaking.token()).to.be.eq(fakeWBTC.address)
      expect(await hegicStaking.STAKING_LOT_PRICE()).to.be.eq(
        ethers.utils.parseUnits("888000", await fakeHegic.decimals()),
      )
      expect(await hegicStaking.totalProfit()).to.be.eq(BN.from(0))
      expect(await hegicStaking.classicLockupPeriod()).to.be.eq(BN.from(86400))
      expect(await hegicStaking.microLockupPeriod()).to.be.eq(BN.from(86400))
      expect(
        await hegicStaking.lastBoughtTimestamp(ethers.constants.AddressZero),
      ).to.be.eq(BN.from(0))
    })
  })
  describe("claimProfits", () => {
    it("revert if there is zero profit", async () => {
      await expect(
        hegicStaking.claimProfits(await alice.getAddress()),
      ).to.be.revertedWith("Zero profit")
    })
    it("should allow Bob to claim profits", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      await hegicStaking.connect(bob).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, amount)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      const fakeWBTCBalanceBefore = await fakeWBTC.balanceOf(
        await bob.getAddress(),
      )
      expect(fakeWBTCBalanceBefore).to.be.eq(BN.from(0))
      await hegicStaking.claimProfits(await bob.getAddress())
      const fakeWBTCBalanceAfter = await fakeWBTC.balanceOf(
        await bob.getAddress(),
      )
      expect(fakeWBTCBalanceAfter).to.be.eq(
        ethers.utils.parseUnits("5000", await fakeWBTC.decimals()),
      )
    })
  })
  describe("buy", () => {
    it("revert if the amount is zero", async () => {
      await expect(
        hegicStaking.connect(alice).buyStakingLot(BN.from(0)),
      ).to.be.revertedWith("Amount is zero")
    })
    it("revert if the amount is greater than MAX_SUPPLY", async () => {
      await expect(hegicStaking.connect(alice).buyStakingLot(BN.from(1500))).to
        .be.reverted
    })
    it("should send HEGIC when buying a lot", async () => {
      const hegicBalanceBefore = await fakeHegic.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicBalanceBefore).to.be.eq(
        ethers.utils.parseUnits("888000", await fakeHegic.decimals()),
      )
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      const hegicBalanceAfter = await fakeHegic.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicBalanceAfter).to.be.eq(BN.from(0))
    })
    it("should return a token buying a lot", async () => {
      const hegicStakingBalanceBefore = await hegicStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicStakingBalanceBefore).to.be.eq(BN.from(0))
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      const hegicStakingBalanceAfter = await hegicStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicStakingBalanceAfter).to.be.eq(BN.from(1))
    })
  })
  describe("sell", () => {
    it("should revert if attempting to sell in the lockup period", async () => {
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      await expect(
        hegicStaking.connect(alice).sellStakingLot(BN.from(1)),
      ).to.be.revertedWith("The action is suspended due to the lockup")
    })
    it("should return HEGIC when selling a lot", async () => {
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      await ethers.provider.send("evm_increaseTime", [
        BN.from(172800).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await hegicStaking.connect(alice).sellStakingLot(BN.from(1))
      const hegicBalanceAfter = await fakeHegic.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicBalanceAfter).to.be.eq(
        ethers.utils.parseUnits("888000", await fakeHegic.decimals()),
      )
    })
    it("should burn the lot token when selling a lot", async () => {
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      const hegicStakingBalanceBefore = await hegicStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicStakingBalanceBefore).to.be.eq(BN.from(1))
      await ethers.provider.send("evm_increaseTime", [
        BN.from(172800).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await hegicStaking.connect(alice).sellStakingLot(BN.from(1))
      const hegicStakingBalanceAfter = await hegicStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(hegicStakingBalanceAfter).to.be.eq(BN.from(0))
    })
  })
  describe("profitOf", () => {
    it("return the profit for an account", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      await hegicStaking.connect(bob).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, amount)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      const profit = await hegicStaking
        .connect(alice)
        .profitOf(await alice.getAddress())
      expect(profit).to.be.eq(
        ethers.utils.parseUnits("5000", await fakeWBTC.decimals()),
      )
    })
  })
  describe("distributeUnrealizedRewards", () => {
    it("should allow another account to send profit", async () => {
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      const fakeWBTCBalanceBefore = await fakeWBTC.balanceOf(
        await alice.getAddress(),
      )
      expect(fakeWBTCBalanceBefore).to.be.eq(
        ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
      )
      await fakeWBTC
        .connect(alice)
        .transfer(
          hegicStaking.address,
          ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
        )
      await hegicStaking.connect(alice).distributeUnrealizedRewards()

      const fakeWBTCBalanceAfter = await fakeWBTC.balanceOf(
        await alice.getAddress(),
      )
      expect(fakeWBTCBalanceAfter).to.be.eq(BN.from(0))
    })
    it("should receive profit sent", async () => {
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      const fakeWBTCBalanceBefore = await fakeWBTC.balanceOf(
        hegicStaking.address,
      )
      expect(fakeWBTCBalanceBefore).to.be.eq(BN.from(0))
      await fakeWBTC
        .connect(alice)
        .transfer(
          hegicStaking.address,
          ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
        )
      await hegicStaking.connect(alice).distributeUnrealizedRewards()

      const fakeWBTCBalanceAfter = await fakeWBTC.balanceOf(
        hegicStaking.address,
      )
      expect(fakeWBTCBalanceAfter).to.be.eq(
        ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
      )
    })
    it("should send all to basic lots if there are no micro lots", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await hegicStaking.connect(alice).buyStakingLot(1)
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, amount)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      expect(await hegicStaking.profitOf(await alice.getAddress())).to.be.eq(
        amount,
      )
    })
    it("should send all to micro lots if there are no basic lots", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await hegicStaking.connect(alice).buyMicroLot("1000")
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, amount)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      expect(await hegicStaking.profitOf(await alice.getAddress())).to.be.eq(
        amount,
      )
    })
    it("should send all to FALLBACK RECIPIENT if there are no any lots", async () => {
      const totalProfitBefore = await hegicStaking.totalProfit()
      expect(totalProfitBefore).to.be.eq(BN.from(0))
      const microLotsProfitsBefore = await hegicStaking.microLotsProfits()
      expect(microLotsProfitsBefore).to.be.eq(BN.from(0))
      await fakeWBTC
        .connect(alice)
        .transfer(
          hegicStaking.address,
          ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
        )
      await expect(
        hegicStaking.connect(alice).distributeUnrealizedRewards(),
      ).not.to.emit(hegicStaking, "Profit")
      const totalProfitAfter = await hegicStaking.totalProfit()
      expect(totalProfitAfter).to.be.eq(totalProfitBefore).to.be.eq(BN.from(0))
      const microLotsProfitsAfter = await hegicStaking.microLotsProfits()
      expect(microLotsProfitsAfter)
        .to.be.eq(microLotsProfitsBefore)
        .to.be.eq(BN.from(0))
    })
    it("should emit a Profit event", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, amount)
      await expect(hegicStaking.connect(alice).distributeUnrealizedRewards())
        .to.emit(hegicStaking, "Profit")
        .withArgs(amount)
    })
    it("should update totalProfit", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await hegicStaking.connect(alice).buyStakingLot(BN.from(1))
      await hegicStaking.connect(bob).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, amount)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      expect(await hegicStaking.totalProfit()).to.be.eq(
        amount.mul(BN.from(10).pow(30)).div(2),
      )
    })
    it("should send 20% of profit to microlots", async () => {
      await hegicStaking.connect(alice).buyMicroLot(1000)
      await hegicStaking.connect(bob).buyStakingLot(1)
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, 100000)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      expect(await hegicStaking.profitOf(await alice.getAddress())).to.be.eq(
        20000,
      )
    })
    it("should send 80% of profit to lots", async () => {
      await hegicStaking.connect(alice).buyMicroLot(1000)
      await hegicStaking.connect(bob).buyStakingLot(1)
      await fakeWBTC.connect(alice).transfer(hegicStaking.address, 100000)
      await hegicStaking.connect(alice).distributeUnrealizedRewards()
      expect(await hegicStaking.profitOf(await bob.getAddress())).to.be.eq(
        80000,
      )
    })
    it("should distribute profit correctly", async () => {
      await fakeHegic
        .connect(deployer)
        .approve(hegicStaking.address, ethers.constants.MaxUint256)
      await fakeHegic.mint(
        await deployer.getAddress(),
        ethers.utils.parseUnits("8880000"),
      )
      await fakeWBTC.mint(
        await deployer.getAddress(),
        ethers.utils.parseUnits("100000", 8),
      )

      await fakeWBTC
        .connect(deployer)
        .approve(hegicStaking.address, ethers.constants.MaxUint256)

      await hegicStaking
        .connect(deployer)
        .buyMicroLot(ethers.utils.parseUnits("900"))
      await hegicStaking.connect(deployer).buyStakingLot(4)

      await hegicStaking.connect(alice).buyStakingLot(1)
      await hegicStaking
        .connect(bob)
        .buyMicroLot(ethers.utils.parseUnits("100"))

      await fakeWBTC.connect(deployer).transfer(hegicStaking.address, 100000)
      await hegicStaking.connect(deployer).distributeUnrealizedRewards()
      // 10% from 20% from 100 000 = 0.1 * 0.2 * 100 000 = 2 000
      expect(await hegicStaking.profitOf(await bob.getAddress())).to.be.eq(2000)
      // 20% from 80% from 100 000 = 0.2 * 0.8 * 100 000 = 16 000
      expect(await hegicStaking.profitOf(await alice.getAddress())).to.be.eq(
        16000,
      )
      // 90% from 20% from 100 000 and 80% from 80% from 100 000 =
      // = 0.9 * 0.2 * 100 000 + 0.8 * 0.8 * 100 = 82 000
      expect(await hegicStaking.profitOf(await deployer.getAddress())).to.be.eq(
        82000,
      )
    })
  })
})
