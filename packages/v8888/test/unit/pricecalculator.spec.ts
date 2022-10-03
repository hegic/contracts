import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicPool} from "../../typechain/HegicPool"
import {WethMock} from "../../typechain/WethMock"
import {IvlPriceCalculator} from "../../typechain/IvlPriceCalculator"
import {PriceProviderMock} from "../../typechain/PriceProviderMock"
import {deployParams} from "../../deploy/06_AdaptivePricers"

chai.use(solidity)
const {expect} = chai

describe("PriceCalculator", async () => {
  let hegicPoolWETH: HegicPool
  let priceCalculator: IvlPriceCalculator
  let WETH: WethMock
  let fakePriceProvider: PriceProviderMock
  let alice: Signer

  beforeEach(async () => {
    await deployments.fixture(["test"])
    ;[, alice] = await ethers.getSigners()

    WETH = (await ethers.getContract("WETH")) as WethMock

    hegicPoolWETH = (await ethers.getContract("HegicWETHCALL")) as HegicPool
    //
    // const SELLER_ROLE = await hegicPoolWETH.SELLER_ROLE()
    // hegicPoolWETH.grantRole(SELLER_ROLE, await alice.getAddress())

    fakePriceProvider = (await ethers.getContract(
      "ETHPriceProvider",
    )) as PriceProviderMock
    priceCalculator = (await ethers.getContract(
      "ETHCallPriceCalculator",
    )) as IvlPriceCalculator

    await WETH.connect(alice).deposit({value: ethers.utils.parseEther("1000")})
    await WETH.connect(alice).approve(
      hegicPoolWETH.address,
      ethers.constants.MaxUint256,
    )
    await hegicPoolWETH
      .connect(alice)
      .provideFrom(
        await alice.getAddress(),
        ethers.utils.parseEther("100"),
        true,
        0,
      )
  })

  describe("constructor & settings", async () => {
    it("should set all initial state", async () => {
      expect(await priceCalculator.impliedVolRate()).to.be.eq(
        deployParams.ETHIVRate,
      )
      // expect(await priceCalculator.utilizationRate()).to.be.eq(BN.from(0))
      expect(await priceCalculator.priceProvider()).to.be.eq(
        fakePriceProvider.address,
      )
    })
  })

  describe("setImpliedVolRate", async () => {
    it("should revert if the caller is not the owner", async () => {
      await expect(
        priceCalculator.connect(alice).setImpliedVolRate(BN.from(22000)),
      ).to.be.revertedWith("caller is not the owner")
    })

    it("should set the impliedVolRate correctly", async () => {
      const impliedVolRateBefore = await priceCalculator.impliedVolRate()
      expect(impliedVolRateBefore).to.be.eq(deployParams.ETHIVRate)
      await priceCalculator.setImpliedVolRate(BN.from(11000))
      const impliedVolRateAfter = await priceCalculator.impliedVolRate()
      expect(impliedVolRateAfter).to.be.eq(BN.from(11000))
    })
  })

  describe("calculateTotalPremium", async () => {
    it("should revert if the strike is not the current price", async () => {
      await expect(
        priceCalculator.calculateTotalPremium(
          BN.from(604800),
          BN.from(100),
          BN.from(50100),
        ),
      ).to.be.revertedWith("PriceCalculator: The strike is invalid")
    })

    it("should return correct values", async () => {
      const feeResponse = await priceCalculator.calculateTotalPremium(
        BN.from(604800),
        BN.from(ethers.utils.parseUnits("1")),
        BN.from(0),
      )
      expect(feeResponse.settlementFee).to.be.eq("8393154000000000")
      expect(feeResponse.premium).to.be.eq("33572616000000000")
    })
  })

  describe("_priceModifier", () => {
    const prices: number[] = []
    beforeEach(async () => {
      await hegicPoolWETH.setMaxUtilizationRate(100)
    })
    for (let utilized = 0; utilized < 100; utilized += 10)
      it(`test ${utilized}%`, async () => {
        if (utilized > 0)
          await hegicPoolWETH
            .connect(alice)
            .sellOption(
              await alice.getAddress(),
              7 * 24 * 3600,
              ethers.utils.parseEther((utilized * 2).toString()),
              0,
            )
        const x = await hegicPoolWETH.calculateTotalPremium(
          7 * 24 * 3600,
          ethers.utils.parseEther("10"),
          0,
        )
        prices.push(parseInt(x.premium.add(x.settlementFee).toString()) / 1e18)
      })
    after(() => {
      if (process.env.DEV) console.table(prices)
    })
  })
})
