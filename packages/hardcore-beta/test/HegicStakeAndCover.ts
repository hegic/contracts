import {ethers, deployments, timeAndMine} from "hardhat"
import {BigNumber as BN} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {Erc20Mock as ERC20} from "../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../typechain/HegicOperationalTreasury"
import {HegicStakeAndCover} from "../typechain/HegicStakeAndCover"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["stake-and-cover"])

  const [deployer, alice, piter] = await ethers.getSigners()

  return {
    deployer,
    alice,
    piter,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    HEGIC: (await ethers.getContract("HEGIC")) as ERC20,
    HegicStakeAndCover: (await ethers.getContract(
      "HegicStakeAndCover",
    )) as HegicStakeAndCover,
  }
})

describe("HegicStakeAndCover", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>
  beforeEach(async () => {
    contracts = await fixture()
    const {alice, deployer, HEGIC} = contracts

    const baseTokenAmount = ethers.utils.parseUnits(
      "10000000",
      await contracts.USDC.decimals(),
    )
    const hegicTokenAmount = ethers.utils.parseUnits(
      "100000000",
      await HEGIC.decimals(),
    )

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits(
        "1000000000000000",
        await contracts.USDC.decimals(),
      ),
    )
    await HEGIC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("1000000000000000", await HEGIC.decimals()),
    )
    contracts.HEGIC.connect(alice).approve(
      contracts.HegicStakeAndCover.address,
      ethers.constants.MaxUint256,
    )
    contracts.USDC.connect(alice).approve(
      contracts.HegicStakeAndCover.address,
      ethers.constants.MaxUint256,
    )

    await contracts.USDC.mint(
      contracts.HegicStakeAndCover.address,
      baseTokenAmount,
    )
    await contracts.HEGIC.mint(
      contracts.HegicStakeAndCover.address,
      hegicTokenAmount,
    )
    await contracts.HegicStakeAndCover.saveFreeTokens()
  })

  describe("Logic check", async () => {
    it("Should calculate intrinsic value correct", async () => {
      const {HegicStakeAndCover, USDC, HEGIC} = contracts
      expect(
        (await HegicStakeAndCover.totalBalance())
          .div("1" + "0".repeat(await HEGIC.decimals()))
          .div(
            (await USDC.balanceOf(HegicStakeAndCover.address)).div(
              "1" + "0".repeat(await USDC.decimals()),
            ),
          ),
      ).to.be.eq(BN.from(10))
    })

    describe("Claim", async () => {
      let USDCBalanceBeforeClaim: BN
      let HEGICBalanceBeforeClaim: BN
      let USDCBalanceAfterClaim: BN
      let HEGICBalanceAfterClaim: BN

      let USDCBalanceBeforeProvide: BN
      let HEGICBalanceBeforeProvide: BN
      let USDCBalanceAfterProvide: BN
      let HEGICBalanceAfterProvide: BN

      beforeEach(async () => {
        const {alice, HegicStakeAndCover, USDC, HEGIC} = contracts
        USDCBalanceBeforeProvide = await USDC.balanceOf(
          HegicStakeAndCover.address,
        )
        HEGICBalanceBeforeProvide = await HegicStakeAndCover.totalBalance()
        await HegicStakeAndCover.connect(alice).provide(
          ethers.utils.parseUnits("1000000", await HEGIC.decimals()),
        )
        USDCBalanceAfterProvide = await USDC.balanceOf(
          HegicStakeAndCover.address,
        )
        HEGICBalanceAfterProvide = await HegicStakeAndCover.totalBalance()
        await USDC.mint(
          contracts.HegicStakeAndCover.address,
          ethers.utils.parseUnits("100000", await USDC.decimals()),
        )
        USDCBalanceBeforeClaim = await USDC.balanceOf(await alice.getAddress())
        HEGICBalanceBeforeClaim = await HegicStakeAndCover.balanceOf(
          await alice.getAddress(),
        )

        await HegicStakeAndCover.connect(alice).claimProfit()

        USDCBalanceAfterClaim = await USDC.balanceOf(await alice.getAddress())
        HEGICBalanceAfterClaim = await HegicStakeAndCover.balanceOf(
          await alice.getAddress(),
        )
      })

      it("Should claim correct amount of USDC", async () => {
        expect(USDCBalanceAfterClaim.sub(USDCBalanceBeforeClaim)).to.be.eq(
          990099008,
        )
      })

      it("Should decrease HEGIC balance for user", async () => {
        expect(HEGICBalanceBeforeClaim.sub(HEGICBalanceAfterClaim)).to.be.eq(
          BN.from("9803921559705882352941"),
        )
      })

      it("Should revert transcation when current balance <= start balance", async () => {
        expect(
          contracts.HegicStakeAndCover.connect(contracts.alice).claimProfit(),
        ).to.be.revertedWith("HegicStakeAndCover: The claimable profit is zero")
      })

      it("Should move the correct amount of USDC from user address to Insurance pool when he/she provide HEGIC", async () => {
        expect(
          HEGICBalanceBeforeProvide.div(USDCBalanceBeforeProvide),
        ).to.be.eq(HEGICBalanceAfterProvide.div(USDCBalanceAfterProvide))
      })

      it("Should return the correct availableBalance", async () => {
        expect(await contracts.HegicStakeAndCover.availableBalance()).to.be.eq(
          BN.from("10199009900992"),
        )
      })

      it("Should return the correct shareOf", async () => {
        const {alice, HegicStakeAndCover, USDC} = contracts
        expect(
          await HegicStakeAndCover.shareOf(await alice.getAddress()),
        ).to.be.eq(ethers.utils.parseUnits("100000", await USDC.decimals()))
      })

      it("Should return the correct profitOf", async () => {
        expect(
          await contracts.HegicStakeAndCover.profitOf(
            await contracts.alice.getAddress(),
          ),
        ).to.be.eq(0)
      })

      it("Should revert withdraw HEGIC transcation when withdrawEnabled = false ", async () => {
        expect(
          contracts.HegicStakeAndCover.connect(contracts.alice).withdraw(
            ethers.utils.parseUnits(
              "990196.078440294",
              await contracts.HEGIC.decimals(),
            ),
          ),
        ).to.be.revertedWith(
          "HegicStakeAndCover: Withdrawals are currently disabled",
        )
      })

      it("Should withdraw HEGIC/USDC from Insurance Pool when withdrawEnabled = true ", async () => {
        const {alice, deployer, HegicStakeAndCover, USDC, HEGIC} = contracts
        await HegicStakeAndCover.connect(deployer).setWithdrawalsEnabled(true)
        let USDCBalanceBefore = await USDC.balanceOf(HegicStakeAndCover.address)
        let HEGICBalanceBefore = await HegicStakeAndCover.totalBalance()
        HegicStakeAndCover.connect(alice).withdraw(
          ethers.utils.parseUnits("990196.078440294", await HEGIC.decimals()),
        )
        let USDCBalanceAfter = await USDC.balanceOf(HegicStakeAndCover.address)
        let HEGICBalanceAfter = await HegicStakeAndCover.totalBalance()

        expect(USDCBalanceBefore.sub(USDCBalanceAfter)).to.be.eq(
          ethers.utils.parseUnits("100000", await USDC.decimals()),
        )

        expect(HEGICBalanceBefore.sub(HEGICBalanceAfter)).to.be.eq(
          ethers.utils.parseUnits("990196.078440294", await HEGIC.decimals()),
        )
      })

      it("Should withdraw USDC from Insurance Pool (deployer only)", async () => {
        const {alice, deployer, HegicStakeAndCover, USDC} = contracts
        await HegicStakeAndCover.connect(deployer).transfer(
          await alice.getAddress(),
          ethers.utils.parseUnits("10100000", await USDC.decimals()),
        )
        expect(await USDC.balanceOf(HegicStakeAndCover.address)).to.be.eq(
          ethers.utils.parseUnits("99009.900992", await USDC.decimals()),
        )
      })

      it("Should revert transcation when msg.sender try to change setWithdrawalsEnabled (msg.sender isn't owner)", async () => {
        expect(
          contracts.HegicStakeAndCover.connect(
            contracts.alice,
          ).setWithdrawalsEnabled(true),
        ).to.be.reverted
      })

      it("Should revert transcation when msg.sender try to withdraw USDC from Insurance Pool(msg.sender isn't owner)", async () => {
        expect(
          contracts.HegicStakeAndCover.connect(contracts.alice).transfer(
            await contracts.alice.getAddress(),
            ethers.utils.parseUnits("1", await contracts.USDC.decimals()),
          ),
        ).to.be.reverted
      })

      it("Should send half of HEGIC balance from Alice to Piter and calculate correct new balanceOf and ShareOf", async () => {
        // AssertionError: Expected "495098039220147000000000" to be equal 495098039220147117647059
        const {alice, deployer, piter, HegicStakeAndCover, HEGIC, USDC} =
          contracts
        await HegicStakeAndCover.connect(alice).transferShare(
          await piter.getAddress(),
          BN.from("495098039220147000000000"),
        )

        expect(ethers.utils.parseUnits("50000", await USDC.decimals()))
          .to.be.eq(await HegicStakeAndCover.shareOf(await piter.getAddress()))
          .to.be.eq(await HegicStakeAndCover.shareOf(await alice.getAddress()))

        expect(BN.from("495098039220147000000000")).to.be.eq(
          await HegicStakeAndCover.balanceOf(await piter.getAddress()),
        )
        expect(BN.from("495098039220147117647059")).to.be.eq(
          await HegicStakeAndCover.balanceOf(await alice.getAddress()),
        )
      })

      it("Should revert claim transcation for Piter", async () => {
        const {alice, deployer, piter, HegicStakeAndCover, HEGIC, USDC} =
          contracts
        await HegicStakeAndCover.connect(alice).transferShare(
          await piter.getAddress(),
          BN.from("495098039220147000000000"),
        )
        expect(
          HegicStakeAndCover.connect(piter).claimProfit(),
        ).to.be.revertedWith("HegicStakeAndCover: The claimable profit is zero")
        expect(
          await ethers.utils.parseUnits("50000", await USDC.decimals()),
        ).to.be.eq(
          await HegicStakeAndCover.startBalance(await alice.getAddress()),
        )
      })
    })
  })
})
