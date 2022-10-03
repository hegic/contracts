import {ethers, deployments, timeAndMine} from "hardhat"
import chai from "chai"
const {expect} = chai
import {Signer} from "ethers"

import {GradualTokenSwap} from "../../typechain/GradualTokenSwap"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"

describe("ERC20Recovery", () => {
  const provideAmount = ethers.utils.parseUnits("1000000")
  let GTS: GradualTokenSwap
  let HEGIC: ERC20
  let alice: Signer
  let deployer: Signer

  beforeEach(async () => {
    await deployments.fixture("GTS")
    GTS = (await ethers.getContract("GradualTokenSwap")) as GradualTokenSwap
    HEGIC = (await ethers.getContract("HEGIC")) as ERC20
    await HEGIC.mint(GTS.address, provideAmount)
    ;[deployer, alice] = await ethers.getSigners()
  })

  it("should revert HEGIC tokens only from owner account", async () => {
    await expect(
      GTS.connect(alice).recoverERC20(HEGIC.address),
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("should revert HEGIC tokens", async () => {
    const startBalance = await HEGIC.balanceOf(await deployer.getAddress())
    await GTS.recoverERC20(HEGIC.address)

    const balance = await HEGIC.balanceOf(await deployer.getAddress())
    expect(balance.sub(startBalance)).to.be.eq("1000000000000000000000000")
  })
})

describe("GradualTokenSwap", () => {
  const provideAmount = ethers.utils.parseUnits("1000000")
  let GTS: GradualTokenSwap
  let HEGIC: ERC20
  let rHEGIC: ERC20
  let alice: Signer
  let deployer: Signer

  beforeEach(async () => {
    await deployments.fixture("GTS")
    GTS = (await ethers.getContract("GradualTokenSwap")) as GradualTokenSwap
    HEGIC = (await ethers.getContract("HEGIC")) as ERC20
    rHEGIC = (await ethers.getContract("rHEGIC")) as ERC20
    await HEGIC.mint(GTS.address, provideAmount)
    ;[deployer, alice] = await ethers.getSigners()
  })

  it("should has 1 000 000 HEGIC", async () => {
    const balance = await HEGIC.balanceOf(GTS.address)
    expect(balance).to.be.eq("1000000000000000000000000")
  })

  it("should receive rHEGIC tokens", async () => {
    const amount = ethers.utils.parseUnits("250000")

    await rHEGIC.mint(await deployer.getAddress(), amount)

    const startBalance = await rHEGIC.balanceOf(await deployer.getAddress())
    await rHEGIC.approve(GTS.address, amount)
    await GTS.provide(amount)

    const balance = await rHEGIC.balanceOf(await deployer.getAddress())
    expect(startBalance.sub(balance)).to.be.eq(amount)

    expect(await GTS.provided(await deployer.getAddress())).to.be.eq(amount)
  })

  describe("should withdraw funds gradually", async () => {
    const amount = ethers.utils.parseUnits("1000000")
    const points = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    beforeEach(async () => {
      await rHEGIC.mint(await deployer.getAddress(), amount)
      await rHEGIC.approve(GTS.address, amount)
      await GTS.provide(amount)
    })

    for (let t of points)
      it(`unlocked (${t}%)`, async () => {
        const expected = amount.mul(t).div(100)
        const start = await GTS.start()
        const duration = await GTS.duration()

        await timeAndMine.setTime(
          start.add(duration.mul(t).div(100)).toNumber(),
        )

        expect(await GTS.unlocked(await deployer.getAddress())).to.be.eq(
          expected,
        )
      })

    for (let t of points)
      it(`withdraw (${t}%)`, async () => {
        const expected = amount.mul(t).div(100)
        const start = await GTS.start()
        const duration = await GTS.duration()

        await timeAndMine.setTimeNextBlock(
          start.add(duration.mul(t).div(100)).toNumber(),
        )

        await expect(() => GTS.withdraw()).changeTokenBalances(
          HEGIC,
          [deployer, {getAddress: () => GTS.address}],
          [expected, expected.mul(-1)],
        )
      })
  })
})
