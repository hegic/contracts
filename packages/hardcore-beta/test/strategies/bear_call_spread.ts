import {ethers, deployments, timeAndMine} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStrategyInverseBearCallSpread} from "../../typechain/HegicStrategyInverseBearCallSpread"
import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {CombinePriceCalculator} from "../../typechain/CombinePriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicInverseOperationalTreasury} from "../../typechain/HegicInverseOperationalTreasury"
import {HegicStrategy} from "../../typechain/HegicStrategy"
import {HegicStakeAndCover} from "../../typechain/HegicStakeAndCover"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-bear_call_spread"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicInversBearCallSpread110ETH: (await ethers.getContract(
      "HegicStrategyInverseBEAR_CALL_SPREAD_110_ETH",
    )) as HegicStrategy,
    hegicInversBearCallSpread110BTC: (await ethers.getContract(
      "HegicStrategyInverseBEAR_CALL_SPREAD_110_BTC",
    )) as HegicStrategyInverseBearCallSpread,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,
    PriceCalculatorInverseBEAR_CALL_SPREAD_110_ETH: (await ethers.getContract(
      "PriceCalculatorInverseBEAR_CALL_SPREAD_110_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorInverseBEAR_CALL_SPREAD_110_BTC: (await ethers.getContract(
      "PriceCalculatorInverseBEAR_CALL_SPREAD_110_BTC",
    )) as BasePriceCalculator,
    ethPriceFeed: (await ethers.getContract(
      "PriceProviderETH",
    )) as AggregatorV3Interface,
    btcPriceFeed: (await ethers.getContract(
      "PriceProviderBTC",
    )) as AggregatorV3Interface,
    HegicInverseOperationalTreasury: (await ethers.getContract(
      "HegicInverseOperationalTreasury",
    )) as HegicInverseOperationalTreasury,
    BasePriceCalculator_PUT_BTC: (await ethers.getContract(
      "BasePriceCalculator_PUT_BTC",
    )) as BasePriceCalculator,
    BasePriceCalculator_PUT_ETH: (await ethers.getContract(
      "BasePriceCalculator_PUT_ETH",
    )) as BasePriceCalculator,
    BasePriceCalculator_CALL_BTC: (await ethers.getContract(
      "BasePriceCalculator_CALL_BTC",
    )) as BasePriceCalculator,
    BasePriceCalculator_CALL_ETH: (await ethers.getContract(
      "BasePriceCalculator_CALL_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_CALL_110_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_CALL_110_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_BTC",
    )) as BasePriceCalculator,
    PriceCalculatorATM_CALL_ETH: (await ethers.getContract(
      "PriceCalculatorATM_CALL_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorATM_CALL_BTC: (await ethers.getContract(
      "PriceCalculatorATM_CALL_BTC",
    )) as BasePriceCalculator,
    pricerETH: (await ethers.getContract(
      "PriceCalculatorInverseBEAR_CALL_SPREAD_110_ETH",
    )) as BasePriceCalculator,
    pricerBTC: (await ethers.getContract(
      "PriceCalculatorInverseBEAR_CALL_SPREAD_110_BTC",
    )) as BasePriceCalculator,
    CombinePriceCalculatorETH: (await ethers.getContract(
      "PriceCalculatorInverseBEAR_CALL_SPREAD_110_ETH",
    )) as CombinePriceCalculator,
    CombinePriceCalculatorBTC: (await ethers.getContract(
      "PriceCalculatorInverseBEAR_CALL_SPREAD_110_BTC",
    )) as CombinePriceCalculator,
    HegicStakeAndCover: (await ethers.getContract(
      "HegicStakeAndCover",
    )) as HegicStakeAndCover,
    HEGIC: (await ethers.getContract("HEGIC")) as ERC20,
  }
})

describe("HegicInversBearCallSpread", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {
      alice,
      deployer,
      hegicInversBearCallSpread110ETH,
      hegicInversBearCallSpread110BTC,
      PriceCalculatorInverseBEAR_CALL_SPREAD_110_ETH,
      PriceCalculatorInverseBEAR_CALL_SPREAD_110_BTC,
      BasePriceCalculator_CALL_ETH,
      BasePriceCalculator_CALL_BTC,
      PriceCalculatorOTM_CALL_110_ETH,
      PriceCalculatorOTM_CALL_110_BTC,
      CombinePriceCalculatorETH,
      HegicStakeAndCover,
      HEGIC,
      USDC,
    } = contracts

    await PriceCalculatorInverseBEAR_CALL_SPREAD_110_ETH.setPeriodLimits(
      1 * 24 * 3600,
      30 * 24 * 3600,
    )
    await PriceCalculatorInverseBEAR_CALL_SPREAD_110_BTC.setPeriodLimits(
      1 * 24 * 3600,
      30 * 24 * 3600,
    )

    await BasePriceCalculator_CALL_ETH.setCoefficients([
      "49920292581372500000000000000000",
      "88344988669988100000000000",
      "-15424133118651100000",
      "1454774860236",
      "0",
    ])

    await PriceCalculatorOTM_CALL_110_ETH.setDiscount([
      "12295445757987600000000000000",
      "335772481920461000000000",
      "-82197115417880200",
      "7795306794",
      "0",
    ])

    await BasePriceCalculator_CALL_BTC.setCoefficients([
      "680366235595480000000000000000000",
      "1204630634264560000000000000",
      "-210015313956724000000",
      "19817315179867",
      "0",
    ])

    await PriceCalculatorOTM_CALL_110_BTC.setDiscount([
      "-61776432177840100000000000000",
      "317829301721718000000000",
      "-75055964959530600",
      "7482874013",
      "0",
    ])

    await contracts.USDC.mint(
      contracts.HegicInverseOperationalTreasury.address,
      ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
    )
    await contracts.HegicInverseOperationalTreasury.addTokens()

    await HEGIC.mint(
      HegicStakeAndCover.address,
      ethers.utils.parseUnits("100000000"),
    )
    await USDC.mint(HegicStakeAndCover.address, "1000000000000")
    await HegicStakeAndCover.saveFreeTokens()

    await HegicStakeAndCover.transferShare(
      await ethers.getSigners().then((x) => x[1].getAddress()),
      ethers.utils.parseUnits("59000000"),
    )
    await HegicStakeAndCover.transferShare(
      await ethers.getSigners().then((x) => x[2].getAddress()),
      ethers.utils.parseUnits("12300000"),
    )

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
    )

    await contracts.USDC.connect(alice).approve(
      hegicInversBearCallSpread110ETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicInversBearCallSpread110BTC.address,
      ethers.constants.MaxUint256,
    )
    await contracts.ethPriceFeed.setPrice(5000e8)
    await contracts.btcPriceFeed.setPrice(50000e8)
  })

  describe("ETH", async () => {
    it("Should Calculate Correct Option Price & Collateralization", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_after_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let sended_collaterial = alice_balance_before_sell.sub(
        alice_balance_after_sell,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(120.180702e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(162.243938e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10162.243938e6)
      await expect(sended_collaterial).to.be.eq(
        await HegicInverseOperationalTreasury.lockedPremium(),
      )
    })

    it("Should Calculate Correct Option Price & Collateralization[0.8, 0.8]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
        CombinePriceCalculatorETH,
        BasePriceCalculator_CALL_ETH,
        PriceCalculatorOTM_CALL_110_ETH,
      } = contracts
      await BasePriceCalculator_CALL_ETH.setCoefficients([
        "32700000000000100000000000000000",
        "63700000000000000000000000",
        "-7309999999999990000",
        "0",
        "0",
      ])
      await PriceCalculatorOTM_CALL_110_ETH.setDiscount([
        "406801405302195000000000000000",
        "281582222572736000000000",
        "-82325304015217100",
        "9286267606",
        "0",
      ])
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      CombinePriceCalculatorETH.setCoefficients([8e4, -8e4])
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 1000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      let alice_balance_after_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let sended_collaterial = alice_balance_before_sell.sub(
        alice_balance_after_sell,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(24.731135e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(75.268865e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10075.268865e6)
      await expect(sended_collaterial).to.be.eq(
        await HegicInverseOperationalTreasury.lockedPremium(),
      )
    })

    it("Should Cacluclate Correct _getAvailableContracts", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
        CombinePriceCalculatorETH,
        BasePriceCalculator_CALL_ETH,
        PriceCalculatorOTM_CALL_110_ETH,
      } = contracts
      await BasePriceCalculator_CALL_ETH.setCoefficients([
        "32700000000000100000000000000000",
        "63700000000000000000000000",
        "-7309999999999990000",
        "0",
        "0",
      ])
      await PriceCalculatorOTM_CALL_110_ETH.setDiscount([
        "406801405302195000000000000000",
        "281582222572736000000000",
        "-82325304015217100",
        "9286267606",
        "0",
      ])
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      CombinePriceCalculatorETH.setCoefficients([8e4, -8e4])
      let strike_price = 1000e8
      await ethPriceFeed.setPrice(strike_price)

      let {premium, available} =
        await hegicInversBearCallSpread110ETH.calculatePremium(
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
    })

    it("Should correct exercise option when exercise price = hedge strike [3]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      // let exercise_price = 1600e8
      let exercise_price = BN.from(strike_price)
        .mul(BN.from(11))
        .div(BN.from(10))
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10162.243938e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [4]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercise_price = 100000e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10162.243938e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [2]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      // let exercise_price = BN.from(strike_price).mul(BN.from(15)).div(BN.from(10))
      let exercise_price = 1482.72936e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10021.031618e6)
      await expect(alice_balance_changed).to.be.eq(141.21232e6)
    })
    it("Should revert transaction when exercise price = central strike", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let exercise_price = 1412.1232e8
      await ethPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversBearCallSpread110ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("Invalid strike = Current price")
    })
    it("Should revert transaction when exercise price < central strike", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let exercise_price = 1412.1231e8
      await ethPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversBearCallSpread110ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should unlock option's premium and collateralization when is expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_before_unlock = await USDC.balanceOf(
        await alice.getAddress(),
      )

      await timeAndMine.setTime(Math.floor(Date.now() / 1000) + 24 * 3600 * 8)
      await HegicInverseOperationalTreasury.unlock(0)
      let alice_balance_after_unlock = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_unlock.sub(
        alice_balance_before_unlock,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9879.819298e6)
      await expect(alice_balance_changed).to.be.eq(282.42464e6)
    })

    it("Should replanish when balance inversOperatinonalTreasury is zero", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts

      expect(await HegicInverseOperationalTreasury.benchmark()).to.be.eq(
        50000e6,
      )
      await HegicInverseOperationalTreasury.withdraw(
        "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        10000e6,
      )
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(0)

      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_before_unlock = await USDC.balanceOf(
        await alice.getAddress(),
      )
      await timeAndMine.setTime(Math.floor(Date.now() / 1000) + 24 * 3600 * 8)
      await HegicInverseOperationalTreasury.unlock(0)
      let alice_balance_after_unlock = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_unlock.sub(
        alice_balance_before_unlock,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(50000e6)
      await expect(alice_balance_changed).to.be.eq(282.42464e6)
    })

    it("Should replanish when balance inversOperatinonalTreasury is zero (PAY OFF CASE)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts

      expect(await HegicInverseOperationalTreasury.benchmark()).to.be.eq(
        50000e6,
      )
      await HegicInverseOperationalTreasury.withdraw(
        "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
        10000e6,
      )
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(0)

      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercise_price = 1413e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(50000e6)
      await expect(alice_balance_changed).to.be.eq(280.67104e6)
    })

    it("Should revert transaction when premium > setLimit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("120.180701", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBearCallSpread110ETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 7,
            BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })

    it("Should revert transaction when option's period is more than 45 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("120.180703", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBearCallSpread110ETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 45 + 1,
            BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too long")
    })

    it("Should revert transaction when option's period is less than 7 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBearCallSpread110ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110ETH.setLimit(
        ethers.utils.parseUnits("120.180703", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBearCallSpread110ETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 7 - 1,
            BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too short")
    })
  })

  describe("BTC", async () => {
    it("Should Calculate Correct Option Price & Collateralization", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let alice_balance_after_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let sended_collaterial = alice_balance_before_sell.sub(
        alice_balance_after_sell,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110BTC.address,
        ),
      ).to.be.eq(1858.663418e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(1925.936582e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(11925.936582e6)
      await expect(sended_collaterial).to.be.eq(
        await HegicInverseOperationalTreasury.lockedPremium(),
      )
    })

    it("Should correct exercise option when exercise price = hedge strike [2]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercise_price = 20815.3e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(11925.936582e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [3]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercise_price = 1000000e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(11925.936582e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [4]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let alice_balance_before_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercise_price = 19500e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversBearCallSpread110BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9295.336582e6)
      await expect(alice_balance_changed).to.be.eq(2630.6e6)
    })

    it("Should revert transaction when exercise price < central strike [5]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let exercise_price = 18922e8
      await btcPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversBearCallSpread110BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should unlock option's premium and collateralization when is expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let alice_balance_before_unlock = await USDC.balanceOf(
        await alice.getAddress(),
      )

      await timeAndMine.setTime(Math.floor(Date.now() / 1000) + 24 * 3600 * 8)
      await HegicInverseOperationalTreasury.unlock(0)
      let alice_balance_after_unlock = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_unlock.sub(
        alice_balance_before_unlock,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBearCallSpread110BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(8141.336582e6)
      await expect(alice_balance_changed).to.be.eq(3784.6e6)
    })

    it("Should revert transaction when premium > setLimit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("1858.663417", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBearCallSpread110BTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 7,
            BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })

    it("Should revert transaction when option's period is more than 45 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("1858.663419", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBearCallSpread110BTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 45 + 1,
            BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too long")
    })

    it("Should revert transaction when option's period is less than 7 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("1858.663419", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBearCallSpread110BTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 7 - 1,
            BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too short")
    })
    it("Should revert transaction when exercise price = central strike [1]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBearCallSpread110BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let exercise_price = 18923e8
      await btcPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversBearCallSpread110BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("Invalid strike = Current price")
    })

    it("Should Cacluclate Correct _getAvailableContracts", async () => {
      const {
        WBTC,
        btcPriceFeed,
        hegicInversBearCallSpread110BTC,
        CombinePriceCalculatorBTC,
        BasePriceCalculator_CALL_BTC,
        PriceCalculatorOTM_CALL_110_BTC,
      } = contracts
      await BasePriceCalculator_CALL_BTC.setCoefficients([
        "252000000000000000000000000000000",
        "1150000000000000000000000000",
        "-135000000000000000000",
        "0",
        "0",
      ])
      await PriceCalculatorOTM_CALL_110_BTC.setDiscount([
        "281940143730995000000000000000",
        "249776104111215000000000",
        "-80809114003500000",
        "9083676074",
        "0",
      ])
      await hegicInversBearCallSpread110BTC.setLimit(
        ethers.utils.parseUnits("2500", await contracts.USDC.decimals()),
      )
      CombinePriceCalculatorBTC.setCoefficients([6e4, -6e4])
      let strike_price = 21980e8
      await btcPriceFeed.setPrice(strike_price)
    })
  })
})
