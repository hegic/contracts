import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {Facade} from "../../typechain/Facade"
import {HegicPool} from "../../typechain/HegicPool"
import {WethMock} from "../../typechain/WethMock"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {OptionsManager} from "../../typechain/OptionsManager"

chai.use(solidity)
const {expect} = chai
const ONE_DAY = BN.from(86400)
const optionType = {
  PUT: 1,
  CALL: 2,
}

describe("Facade", async () => {
  let facade: Facade
  let WBTC: ERC20
  let USDC: ERC20
  let WETH: WethMock
  let alice: Signer
  let HegicATMCALL_WETH: HegicPool
  let HegicATMPUT_WETH: HegicPool
  let ethPriceFeed: AggregatorV3Interface
  let manager: OptionsManager

  beforeEach(async () => {
    await deployments.fixture()
    ;[, alice] = await ethers.getSigners()

    // router = (await ethers.getContract("UniswapRouterMock")) as Uniswap
    facade = (await ethers.getContract("Facade")) as Facade
    WBTC = (await ethers.getContract("WBTC")) as ERC20
    WETH = (await ethers.getContract("WETH")) as WethMock
    USDC = (await ethers.getContract("USDC")) as ERC20
    USDC = (await ethers.getContract("USDC")) as ERC20
    ethPriceFeed = (await ethers.getContract(
      "ETHPriceProvider",
    )) as AggregatorV3Interface

    HegicATMCALL_WETH = (await ethers.getContract("HegicWETHCALL")) as HegicPool
    HegicATMPUT_WETH = (await ethers.getContract("HegicWETHPUT")) as HegicPool
    HegicATMPUT_WETH = (await ethers.getContract("HegicWETHPUT")) as HegicPool
    manager = (await ethers.getContract("OptionsManager")) as OptionsManager

    await WETH.connect(alice).deposit({value: ethers.utils.parseUnits("100")})

    await WBTC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("1000000", await WBTC.decimals()),
    )

    // await WBTC.connect(alice).approve(
    //   WBTCPool.address,
    //   ethers.constants.MaxUint256,
    // )

    await WETH.connect(alice).approve(
      HegicATMCALL_WETH.address,
      ethers.constants.MaxUint256,
    )

    await USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("1000000", await USDC.decimals()),
    )

    await USDC.connect(alice).approve(
      facade.address,
      ethers.constants.MaxUint256,
    )

    await USDC.connect(alice).approve(
      HegicATMPUT_WETH.address,
      ethers.constants.MaxUint256,
    )

    // await USDC.connect(alice).approve(
    //   USDCPool.address,
    //   ethers.constants.MaxUint256,
    // )

    // await WBTCPool.connect(alice).provideFrom(
    //   await alice.getAddress(),
    //   ethers.utils.parseUnits("100", 8),
    //   true,
    //   0,
    // )

    // await USDCPool.connect(alice).provideFrom(
    //   await alice.getAddress(),
    //   ethers.utils.parseUnits("1000000", 6),
    //   true,
    //   0,
    // )
  })

  // describe("WBTC Options", () => {
  //   it("should create Call option", async () => {
  //     const optionCostInETH = await facade.getOptionCost(
  //       WBTC.address,
  //       ONE_DAY,
  //       ethers.utils.parseUnits("1", 8),
  //       0,
  //       optionType.CALL,
  //     )
  //     await facade
  //       .connect(alice)
  //       .createOption(
  //         WBTC.address,
  //         ONE_DAY,
  //         ethers.utils.parseUnits("1", 8),
  //         0,
  //         optionType.CALL,
  //         {value: optionCostInETH},
  //       )
  //   })
  //
  //   it("should create Put option", async () => {
  //     const optionCostInETH = await facade.getOptionCost(
  //       WBTC.address,
  //       ONE_DAY,
  //       ethers.utils.parseUnits("1", 8),
  //       0,
  //       optionType.PUT,
  //     )
  //     await facade
  //       .connect(alice)
  //       .createOption(
  //         WBTC.address,
  //         ONE_DAY,
  //         ethers.utils.parseUnits("1", 8),
  //         0,
  //         optionType.PUT,
  //         {value: optionCostInETH},
  //       )
  //   })
  // })

  // describe("ETH Options", () => {
  //   beforeEach(async () => {
  //     await HegicATMCALL_WETH.connect(alice).provideFrom(
  //       await alice.getAddress(),
  //       ethers.utils.parseUnits("100"),
  //       true,
  //       0,
  //     )
  //   })
  //   it("should create Call option", async () => {
  //     const optionCostInETH = await facade.getOptionCost(
  //       WETH.address,
  //       ONE_DAY,
  //       ethers.utils.parseUnits("1"),
  //       0,
  //       optionType.CALL,
  //     )
  //     await facade
  //       .connect(alice)
  //       .createOption(
  //         WETH.address,
  //         ONE_DAY,
  //         ethers.utils.parseUnits("1"),
  //         0,
  //         optionType.CALL,
  //         {value: optionCostInETH},
  //       )
  //   })
  //
  //   it("should create Put option", async () => {
  //     const optionCostInETH = await facade.getOptionCost(
  //       WETH.address,
  //       ONE_DAY,
  //       ethers.utils.parseUnits("1"),
  //       0,
  //       optionType.PUT,
  //     )
  //     await facade
  //       .connect(alice)
  //       .createOption(
  //         WETH.address,
  //         ONE_DAY,
  //         ethers.utils.parseUnits("1"),
  //         0,
  //         optionType.PUT,
  //         {value: optionCostInETH},
  //       )
  //   })
  // })

  describe("createOption", () => {
    it("should create call options", async () => {
      await facade
        .connect(alice)
        .provideEthToPool(HegicATMCALL_WETH.address, true, 0, {
          value: ethers.utils.parseEther("10"),
        })
      await facade
        .connect(alice)
        .createOption(
          HegicATMCALL_WETH.address,
          7 * 24 * 3600,
          ethers.utils.parseUnits("1"),
          0,
          [USDC.address, WETH.address],
          ethers.constants.MaxUint256,
        )
      await ethPriceFeed.setPrice(3000e8)
      await HegicATMCALL_WETH.connect(alice).exercise(0)
    })

    it("should create put options", async () => {
      await HegicATMPUT_WETH.connect(alice).provideFrom(
        await alice.getAddress(),
        "10000000000",
        true,
        0,
      )
      await facade
        .connect(alice)
        .createOption(
          HegicATMPUT_WETH.address,
          7 * 24 * 3600,
          ethers.utils.parseUnits("1"),
          0,
          [USDC.address],
          ethers.constants.MaxUint256,
        )
      await ethPriceFeed.setPrice(2000e8)
      await HegicATMPUT_WETH.connect(alice).exercise(0)
    })
  })

  describe("provideEthToPool", () => {
    it("should provide ETH to pool (hedged)", async () => {
      await facade
        .connect(alice)
        .provideEthToPool(HegicATMCALL_WETH.address, true, 0, {
          value: ethers.utils.parseEther("10"),
        })
    })
    it("should provide ETH to pool (unhedged)", async () => {
      await facade
        .connect(alice)
        .provideEthToPool(HegicATMCALL_WETH.address, false, 0, {
          value: ethers.utils.parseEther("10"),
        })
    })
  })

  describe("exercise (for GSN)", () => {
    it("should exercise user's option", async () => {
      await facade.provideEthToPool(HegicATMCALL_WETH.address, true, 0, {
        value: ethers.utils.parseEther("10"),
      })
      await facade
        .connect(alice)
        .createOption(
          HegicATMCALL_WETH.address,
          7 * 24 * 3600,
          ethers.utils.parseUnits("1"),
          0,
          [USDC.address, WETH.address],
          ethers.constants.MaxUint256,
        )
      await manager.connect(alice).setApprovalForAll(facade.address, true)
      await ethPriceFeed.setPrice(3000e8)
      await expect(facade.exercise(0)).to.be.revertedWith(
        "Facade Error: _msgSender is not eligible to exercise the option",
      )
      await facade.connect(alice).exercise(0)
    })
  })
})
