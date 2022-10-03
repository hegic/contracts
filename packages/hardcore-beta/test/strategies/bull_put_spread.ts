import {ethers, deployments, timeAndMine} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStrategyInverseBullPutSpread} from "../../typechain/HegicStrategyInverseBullPutSpread"
import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicInverseOperationalTreasury} from "../../typechain/HegicInverseOperationalTreasury"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-bull_put_spread"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicInversBullPutSpread90ETH: (await ethers.getContract(
      "HegicStrategyInverseBULL_PUT_SPREAD_90_ETH",
    )) as HegicStrategyInverseBullPutSpread,
    hegicInversBullPutSpread90BTC: (await ethers.getContract(
      "HegicStrategyInverseBULL_PUT_SPREAD_90_BTC",
    )) as HegicStrategyInverseBullPutSpread,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,
    pricerETH: (await ethers.getContract(
      "PriceCalculatorInverseBULL_PUT_SPREAD_90_ETH",
    )) as BasePriceCalculator,
    pricerBTC: (await ethers.getContract(
      "PriceCalculatorInverseBULL_PUT_SPREAD_90_BTC",
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
    PriceCalculatorOTM_PUT_90_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_90_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_BTC",
    )) as BasePriceCalculator,
  }
})

describe("HegicInversBullPutSpread", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {
      alice,
      deployer,
      hegicInversBullPutSpread90ETH,
      hegicInversBullPutSpread90BTC,
      pricerETH,
      pricerBTC,
      BasePriceCalculator_PUT_ETH,
      PriceCalculatorOTM_PUT_90_ETH,
      BasePriceCalculator_PUT_BTC,
      PriceCalculatorOTM_PUT_90_BTC,
    } = contracts

    await pricerETH.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)
    await pricerBTC.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)

    await BasePriceCalculator_PUT_ETH.setCoefficients([
      "49920292581372500000000000000000",
      "88344988669988100000000000",
      "-15424133118651100000",
      "1454774860236",
      "0",
    ])

    await PriceCalculatorOTM_PUT_90_ETH.setDiscount([
      "127025649710679000000000000000",
      "237666297376469000000000",
      "-36214625997094800",
      "3589185722",
      "0",
    ])

    await BasePriceCalculator_PUT_BTC.setCoefficients([
      "680366235595480000000000000000000",
      "1204630634264560000000000000",
      "-210015313956724000000",
      "19817315179867",
      "0",
    ])

    await PriceCalculatorOTM_PUT_90_BTC.setDiscount([
      "200135463140208000000000000000",
      "169689242719295000000000",
      "-12897087945485300",
      "1268299904",
      "0",
    ])

    await contracts.USDC.mint(
      contracts.HegicInverseOperationalTreasury.address,
      ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
    )
    await contracts.HegicInverseOperationalTreasury.addTokens()

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
    )

    await contracts.USDC.connect(alice).approve(
      hegicInversBullPutSpread90ETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicInversBullPutSpread90BTC.address,
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
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
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
          hegicInversBullPutSpread90ETH.address,
        ),
      ).to.be.eq(106.20444e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(176.2202e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10176.2202e6)
      await expect(sended_collaterial).to.be.eq(
        await HegicInverseOperationalTreasury.lockedPremium(),
      )
    })

    it("Should correct exercise option when exercise price = hedge strike [2]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
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
      let exercise_price = BN.from(strike_price)
        .mul(BN.from(9))
        .div(BN.from(10))
      // let exercise_price = 1271.91088e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBullPutSpread90ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBullPutSpread90ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10176.2202e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [4]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
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
      let exercise_price = 100e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBullPutSpread90ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBullPutSpread90ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10176.2202e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [3]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
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
      // let exercise_price = BN.from(strike_price)
      //   .mul(BN.from(95))
      //   .div(BN.from(100))
      let exercise_price = 1341.51704e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversBullPutSpread90ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBullPutSpread90ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10035.00788e6)
      await expect(alice_balance_changed).to.be.eq(141.21232e6)
    })

    it("Should revert transaction when exercise price = central strike [1]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
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
        hegicInversBullPutSpread90ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("Invalid strike = Current price")
    })

    it("Should revert transaction when exercise price > central strike [5]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let exercise_price = 1412.1233e8
      await ethPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversBullPutSpread90ETH.connect(deployer).exercise(0),
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
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90ETH
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
          hegicInversBullPutSpread90ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9893.79556e6)
      await expect(alice_balance_changed).to.be.eq(282.42464e6)
    })

    it("Should revert transaction when premium > setLimit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("106.20443", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBullPutSpread90ETH
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
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("106.20443", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBullPutSpread90ETH
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
        hegicInversBullPutSpread90ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90ETH.setLimit(
        ethers.utils.parseUnits("106.20443", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBullPutSpread90ETH
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
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
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
          hegicInversBullPutSpread90BTC.address,
        ),
      ).to.be.eq(1340.963971e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(2443.636029e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(12443.636029e6)
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
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
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
      let exercise_price = 17030.7e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversBullPutSpread90BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBullPutSpread90BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(12443.636029e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [3]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
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
      // let exercise_price = BN.from(strike_price).mul(BN.from(95)).div(BN.from(100))
      let exercise_price = 100e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversBullPutSpread90BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_before_exercise.sub(
        alice_balance_after_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBullPutSpread90BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(12443.636029e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [4]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
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
      // let exercise_price = BN.from(strike_price)
      //   .mul(BN.from(95))
      //   .div(BN.from(100))
      let exercise_price = 18400e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversBullPutSpread90BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversBullPutSpread90BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9705.036029e6)
      await expect(alice_balance_changed).to.be.eq(2738.6e6)
    })

    it("Should revert transaction when exercise price = central strike [1]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
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
        hegicInversBullPutSpread90BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("Invalid strike = Current price")
    })

    it("Should revert transaction when exercise price > central strike [5]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let exercise_price = 18924e8
      await btcPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversBullPutSpread90BTC.connect(deployer).exercise(0),
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
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversBullPutSpread90BTC
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
          hegicInversBullPutSpread90BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(8659.036029e6)
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
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("1340.953971", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBullPutSpread90BTC
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
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("106.20443", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBullPutSpread90BTC
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
        hegicInversBullPutSpread90BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversBullPutSpread90BTC.setLimit(
        ethers.utils.parseUnits("106.20443", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversBullPutSpread90BTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 7 - 1,
            BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too short")
    })
  })
})
