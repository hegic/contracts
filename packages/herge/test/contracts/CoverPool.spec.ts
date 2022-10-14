import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes} from "ethers/lib/utils"
import {constants, BigNumber} from "ethers"
import {getProfitByUserBN} from "../utils/helpers"
import {timeAndMine} from "hardhat"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000"

describe("CoverPool", () => {
  let testData: Fixture

  beforeEach(async () => {
    const {
      HEGIC,
      CoverPool,
      USDC,
      payoffPool,
      signers: [deployer, alice, bob, carl],
    } = (testData = await fixture())

    await CoverPool.grantRole(DEFAULT_ADMIN_ROLE, carl.address)
    await HEGIC.mint(carl.address, parseUnits("100"))
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
    await CoverPool.connect(carl).provide(parseUnits("100"), 0)
    await CoverPool.connect(bob).provide(parseUnits("50"), 0)
  })

  describe("Profits", () => {
    it("should revert transction when fixProfit call not owner", async () => {
      const {
        CoverPool,
        signers: [, alice],
        USDC,
      } = testData

      let profits = 50e6
      await USDC.connect(alice).transfer(CoverPool.address, profits)
      await expect(CoverPool.connect(alice).fixProfit()).to.be.reverted
    })

    it("should correct distribute profits for each user", async () => {
      const {
        CoverPool,
        signers: [deployer, alice, bob, carl],
        USDC,
      } = testData

      const usersArray = [
        await CoverPool.shareOf(1),
        await CoverPool.shareOf(2),
      ]
      const totalShare = await CoverPool.totalShare()
      const finishCoverBalance = BigNumber.from(50e6)
      await USDC.connect(alice).transfer(CoverPool.address, finishCoverBalance)
      await timeAndMine.setTimeIncrease("30d")
      await CoverPool.connect(deployer).fixProfit()
      await CoverPool.connect(carl).claim(1)
      await CoverPool.connect(bob).claim(2)

      const profits = usersArray.map((userShare) =>
        getProfitByUserBN(
          userShare,
          BigNumber.from(0),
          finishCoverBalance,
          totalShare,
        ),
      )
      expect(await USDC.balanceOf(carl.address)).to.be.eq(profits[0])
      expect(await USDC.balanceOf(bob.address)).to.be.eq(profits[1])
    })

    it("should revert withdraw when current epoch isn't ended", async () => {
      const {
        CoverPool,
        signers: [, , , carl],
      } = testData

      let hegic_to_withdraw = await CoverPool.shareOf(1)
      await CoverPool.connect(carl).withdraw(1, hegic_to_withdraw)
      await expect(CoverPool.withdrawEpoch(1, [1])).to.be.reverted
    })

    it("should revert transcation when passed less than 90 days after previous epoch has been started", async () => {
      const {CoverPool} = testData
      await timeAndMine.setTimeIncrease("89d")
      await expect(CoverPool.fallbackEpochClose()).to.be.reverted
    })

    it("should start new epoch when passed more than 90 days after previous has been started", async () => {
      const {CoverPool} = testData
      await timeAndMine.setTimeIncrease("90d")
      await CoverPool.fallbackEpochClose()
      expect(await CoverPool.currentEpoch()).to.be.eq(2)
    })

    it("should send USDC from the Operational Treasury to the Cover Pool ", async () => {
      const {
        CoverPool,
        signers: [deployer],
        USDC,
      } = testData
      await expect(() =>
        CoverPool.connect(deployer).payOut(1.5e6),
      ).changeTokenBalance(USDC, deployer, 1.5e6)
    })

    it("should send HEGIC from the Cover Pool to the payoffPool", async () => {
      const {
        CoverPool,
        payoffPool,
        signers: [deployer],
        HEGIC,
      } = testData
      await expect(() =>
        CoverPool.connect(deployer).payOut(1.5e6),
      ).changeTokenBalance(HEGIC, payoffPool, parseUnits("150"))
    })

    it("should revert PayOut transcation when HEGIC Balance on CoverPool = 0", async () => {
      const {
        CoverPool,
        payoffPool,
        signers: [deployer],
        HEGIC,
      } = testData
      await expect(() =>
        CoverPool.connect(deployer).payOut(1.5e6),
      ).changeTokenBalance(HEGIC, payoffPool, parseUnits("150"))
      await expect(CoverPool.connect(deployer).payOut(1.5e6)).to.be.reverted
    })

    it("Should return correct availableForPayment", async () => {
      const {
        CoverPool,
        signers: [deployer, , bob],
      } = testData
      expect(await CoverPool.availableForPayment()).to.be.eq(1.5e6)
      await CoverPool.connect(bob).provide(parseUnits("150"), 0)
      expect(await CoverPool.availableForPayment()).to.be.eq(3e6)
      await timeAndMine.setTimeIncrease("30d")
      await CoverPool.connect(deployer).fixProfit()
      await CoverPool.connect(bob).provide(parseUnits("150"), 0)
      expect(await CoverPool.availableForPayment()).to.be.eq(4.5e6)
    })

    it("Should grant OPERATIONAL_TRESUARY_ROLE to Carl", async () => {
      const {
        CoverPool,
        payoffPool,
        signers: [deployer, carl],
        HEGIC,
      } = testData
      await CoverPool.connect(deployer).grantRole(
        OPERATIONAL_TRESUARY_ROLE,
        carl.address,
      )

      await expect(() =>
        CoverPool.connect(carl).payOut(1.5e6),
      ).changeTokenBalance(HEGIC, payoffPool, parseUnits("150"))
    })

    it("Should revoke TEMPORARY_ADMIN_ROLE from Deployer", async () => {
      const {
        CoverPool,
        signers: [deployer, carl],
      } = testData
      const TEMPORARY_ADMIN_ROLE = keccak256(
        toUtf8Bytes("TEMPORARY_ADMIN_ROLE"),
      )
      const OPERATIONAL_TRESUARY_ROLE = keccak256(
        toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
      )

      await CoverPool.connect(deployer).revokeRole(
        TEMPORARY_ADMIN_ROLE,
        deployer.address,
      )
      await expect(
        CoverPool.connect(deployer).grantRole(
          OPERATIONAL_TRESUARY_ROLE,
          carl.address,
        ),
      ).to.be.reverted
      await expect(
        CoverPool.connect(deployer).grantRole(
          TEMPORARY_ADMIN_ROLE,
          carl.address,
        ),
      ).to.be.reverted
    })

    it("Should automatically go to the next epoch if enabled ", async () => {
      const {
        CoverPool,
        payoffPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        HEGIC,
      } = testData
      const TEMPORARY_ADMIN_ROLE = keccak256(
        toUtf8Bytes("TEMPORARY_ADMIN_ROLE"),
      )
      const OPERATIONAL_TRESUARY_ROLE = keccak256(
        toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
      )
      //todo
    })

    it("Should revert transcation when user trying to withdraw HEGIC within WINDOWS SIZE Period ", async () => {
      const {
        CoverPool,
        payoffPool,
        signers: [deployer, alice, bob, carl],
        USDC,
        HEGIC,
      } = testData
      const TEMPORARY_ADMIN_ROLE = keccak256(
        toUtf8Bytes("TEMPORARY_ADMIN_ROLE"),
      )
      const OPERATIONAL_TRESUARY_ROLE = keccak256(
        toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
      )
      //todo
    })
  })
})

describe("CoverPool Math", () => {
  let testData: Fixture

  beforeEach(async () => {
    const {
      HEGIC,
      CoverPool,
      USDC,
      payoffPool,
      signers: [deployer, alice, bob, carl, caren],
    } = (testData = await fixture())

    await CoverPool.grantRole(DEFAULT_ADMIN_ROLE, carl.address)
    await HEGIC.mint(carl.address, parseUnits("100"))
    await HEGIC.connect(carl).approve(CoverPool.address, constants.MaxUint256)

    await HEGIC.mint(bob.address, parseUnits("100"))
    await HEGIC.connect(bob).approve(CoverPool.address, constants.MaxUint256)

    await HEGIC.mint(caren.address, parseUnits("100"))
    await HEGIC.connect(caren).approve(CoverPool.address, constants.MaxUint256)

    await USDC.mint(payoffPool.address, parseUnits("1000000"))
    await USDC.connect(payoffPool).approve(
      CoverPool.address,
      parseUnits("1000000"),
    )
    await CoverPool.grantRole(OPERATIONAL_TRESUARY_ROLE, deployer.address)

    await USDC.mint(alice.address, 100000e6)
  })

  describe("USDC Rewards", () => {
    it("Each user should receive correct amount of USDC rewards", async () => {
      const {
        CoverPool,
        signers: [deployer, alice, bob, carl, caren],
        USDC,
      } = testData

      await CoverPool.connect(carl).provide(parseUnits("100"), 0)
      await CoverPool.connect(bob).provide(parseUnits("100"), 0)
      let profits_epoch_1 = 100e6
      await USDC.connect(alice).transfer(CoverPool.address, profits_epoch_1)
      await timeAndMine.setTimeIncrease("30d")
      await CoverPool.connect(deployer).fixProfit()

      await expect(() => CoverPool.connect(bob).claim(2)).changeTokenBalance(
        USDC,
        bob,
        50e6,
      )

      await CoverPool.connect(caren).provide(parseUnits("100"), 0)
      let profits_epoch_2 = 150e6
      await USDC.connect(alice).transfer(CoverPool.address, profits_epoch_2)
      await timeAndMine.setTimeIncrease("30d")
      await CoverPool.connect(deployer).fixProfit()

      await expect(() => CoverPool.connect(carl).claim(1)).changeTokenBalance(
        USDC,
        carl,
        100e6,
      )

      await expect(() => CoverPool.connect(bob).claim(2)).changeTokenBalance(
        USDC,
        bob,
        50e6,
      )

      await expect(() => CoverPool.connect(caren).claim(3)).changeTokenBalance(
        USDC,
        caren,
        50e6,
      )
    })
  })
})

describe("CoverPool: Should correct distribute profits / losses", () => {
  let testData: Fixture
  beforeEach(async () => {
    const {
      HEGIC,
      CoverPool,
      USDC,
      payoffPool,
      signers: [deployer, alice, bob, carl, caren],
    } = (testData = await fixture())

    await CoverPool.grantRole(DEFAULT_ADMIN_ROLE, carl.address)
    await CoverPool.grantRole(OPERATIONAL_TRESUARY_ROLE, deployer.address)

    await HEGIC.mint(deployer.address, parseUnits("200"))
    await HEGIC.connect(deployer).approve(
      CoverPool.address,
      constants.MaxUint256,
    )

    await HEGIC.mint(carl.address, parseUnits("200"))
    await HEGIC.connect(carl).approve(CoverPool.address, constants.MaxUint256)
    await HEGIC.mint(bob.address, parseUnits("100"))
    await HEGIC.connect(bob).approve(CoverPool.address, constants.MaxUint256)
    await HEGIC.mint(caren.address, parseUnits("50"))
    await HEGIC.connect(caren).approve(CoverPool.address, constants.MaxUint256)
    await USDC.mint(payoffPool.address, parseUnits("1000000"))
    await USDC.connect(payoffPool).approve(
      CoverPool.address,
      parseUnits("1000000"),
    )

    await USDC.mint(alice.address, 100000e6)

    await CoverPool.connect(carl).provide(parseUnits("200"), 0)
    await CoverPool.connect(bob).provide(parseUnits("100"), 0)
    await CoverPool.connect(caren).provide(parseUnits("50"), 0)
  })

  it("Zero Profits", async () => {
    const {
      CoverPool,
      signers: [deployer, , bob, , caren],
      USDC,
      HEGIC,
    } = testData

    const boblWithdraw = parseUnits("50")
    const carenlWithdraw = parseUnits("50")

    await CoverPool.connect(bob).withdraw(2, boblWithdraw)
    await CoverPool.connect(caren).withdraw(3, carenlWithdraw)

    await timeAndMine.setTimeIncrease("30d")
    await CoverPool.connect(deployer).fixProfit()

    await CoverPool.connect(bob).withdrawEpoch(2, [1])
    await CoverPool.connect(caren).withdrawEpoch(3, [1])

    expect(await HEGIC.balanceOf(caren.address)).to.be.eq(carenlWithdraw)
    expect(await HEGIC.balanceOf(bob.address)).to.be.eq(boblWithdraw)

    expect(await CoverPool.coverTokenTotal()).to.be.eq(parseUnits("250"))
    expect(await CoverPool.coverTokenBalance(1)).to.be.eq(parseUnits("200"))
    expect(await CoverPool.coverTokenBalance(2)).to.be.eq(parseUnits("50"))
    expect(await CoverPool.coverTokenBalance(3)).to.be.eq(constants.Zero)
  })

  it("Should correctly calcualte share after epoch is ended", async () => {
    const {
      CoverPool,
      signers: [deployer, , bob, , caren],
      USDC,
      HEGIC,
    } = testData

    const boblWithdraw = parseUnits("50")
    const carenlWithdraw = parseUnits("50")

    await CoverPool.connect(bob).withdraw(2, boblWithdraw)
    await CoverPool.connect(caren).withdraw(3, carenlWithdraw)
    await timeAndMine.setTimeIncrease("30d")
    await CoverPool.connect(deployer).fixProfit()

    const deployerProvided = parseUnits("200")
    await CoverPool.connect(deployer).provide(deployerProvided, 0)

    await CoverPool.connect(bob).withdrawEpoch(2, [1])
    await CoverPool.connect(caren).withdrawEpoch(3, [1])

    expect(await CoverPool.coverTokenBalance(4)).to.be.eq(deployerProvided)

    expect(await HEGIC.balanceOf(caren.address)).to.be.eq(carenlWithdraw)
    expect(await HEGIC.balanceOf(bob.address)).to.be.eq(boblWithdraw)

    expect(await CoverPool.coverTokenTotal()).to.be.eq(parseUnits("450"))
    expect(await CoverPool.coverTokenBalance(1)).to.be.eq(parseUnits("200"))
    expect(await CoverPool.coverTokenBalance(2)).to.be.eq(parseUnits("50"))
    expect(await CoverPool.coverTokenBalance(3)).to.be.eq(constants.Zero)
  })

  it("Negative Profits", async () => {
    const {
      CoverPool,
      signers: [deployer, , bob, , caren],
      USDC,
      HEGIC,
    } = testData

    await CoverPool.connect(deployer).payOut(1.5e6)
    await timeAndMine.setTimeIncrease("30d")

    const boblWithdraw = parseUnits("28.57")
    const carenWithdraw = await CoverPool.coverTokenBalance(3)

    await CoverPool.connect(bob).withdraw(2, boblWithdraw)
    await CoverPool.connect(caren).withdraw(3, carenWithdraw)

    await CoverPool.connect(deployer).fixProfit()

    expect(await CoverPool.coverTokenTotal()).to.be.eq(
      parseUnits("142.858571428571428572"),
    )

    await CoverPool.connect(bob).withdrawEpoch(2, [1])
    await CoverPool.connect(caren).withdrawEpoch(3, [1])

    expect(await HEGIC.balanceOf(bob.address)).to.be.eq(boblWithdraw)
    expect(await HEGIC.balanceOf(caren.address)).to.be.eq(carenWithdraw)

    expect(await CoverPool.coverTokenTotal()).to.be.eq(
      parseUnits("142.858571428571428572"),
    )
    expect(await CoverPool.coverTokenBalance(1)).to.be.eq(
      parseUnits("114.285714285714285714"),
    )
    expect(await CoverPool.coverTokenBalance(2)).to.be.eq(
      parseUnits("28.572857142857142857"),
    )
    expect(await CoverPool.coverTokenBalance(3)).to.be.eq(constants.Zero)
  })

  it("Positive Profits", async () => {
    const {
      CoverPool,
      signers: [deployer, alice, bob, carl, caren],
      USDC,
      HEGIC,
    } = testData

    const finishCoverBalance = parseUnits("350", 6)
    await USDC.connect(alice).transfer(CoverPool.address, finishCoverBalance)

    const boblWithdraw = parseUnits("50")
    const carenlWithdraw = parseUnits("50")

    await CoverPool.connect(bob).withdraw(2, boblWithdraw)
    await CoverPool.connect(caren).withdraw(3, carenlWithdraw)

    await timeAndMine.setTimeIncrease("30d")
    await CoverPool.connect(deployer).fixProfit()

    await expect(() => CoverPool.connect(carl).claim(1)).changeTokenBalance(
      USDC,
      carl,
      200e6,
    )

    await expect(() =>
      CoverPool.connect(bob).withdrawEpoch(2, [1]),
    ).changeTokenBalance(USDC, bob, 100e6)

    await expect(() =>
      CoverPool.connect(caren).withdrawEpoch(3, [1]),
    ).changeTokenBalance(USDC, caren, 50e6)

    expect(await HEGIC.balanceOf(caren.address)).to.be.eq(carenlWithdraw)
    expect(await HEGIC.balanceOf(bob.address)).to.be.eq(boblWithdraw)

    expect(await CoverPool.coverTokenTotal()).to.be.eq(parseUnits("250"))
    expect(await CoverPool.coverTokenBalance(1)).to.be.eq(parseUnits("200"))
    expect(await CoverPool.coverTokenBalance(2)).to.be.eq(parseUnits("50"))
    expect(await CoverPool.coverTokenBalance(3)).to.be.eq(constants.Zero)
  })
})
