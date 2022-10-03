import {ethers, deployments, timeAndMine} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStrategyInverseLongCondor} from "../../typechain/HegicStrategyInverseLongCondor"
import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {CombinePriceCalculator} from "../../typechain/CombinePriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicInverseOperationalTreasury} from "../../typechain/HegicInverseOperationalTreasury"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-long_condor"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicInversLongCondor20ETH: (await ethers.getContract(
      "HegicStrategyInverseLONG_CONDOR_20_ETH",
    )) as HegicStrategyInverseLongCondor,
    hegicInversLongCondor20BTC: (await ethers.getContract(
      "HegicStrategyInverseLONG_CONDOR_20_BTC",
    )) as HegicStrategyInverseLongCondor,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,
    pricerETH: (await ethers.getContract(
      "PriceCalculatorInverseLONG_CONDOR_20_ETH",
    )) as BasePriceCalculator,
    pricerBTC: (await ethers.getContract(
      "PriceCalculatorInverseLONG_CONDOR_20_BTC",
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
    PriceCalculatorOTM_CALL_120_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_120_BTC",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_90_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_90_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_BTC",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_80_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_80_BTC",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_CALL_120_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_120_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_80_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_80_ETH",
    )) as BasePriceCalculator,
    pricerETH_combinate: (await ethers.getContract(
      "PriceCalculatorInverseLONG_CONDOR_20_ETH",
    )) as CombinePriceCalculator,
    pricerBTC_combinate: (await ethers.getContract(
      "PriceCalculatorInverseLONG_CONDOR_20_BTC",
    )) as CombinePriceCalculator,
  }
})

describe("HegicInversLongCondor", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {
      alice,
      deployer,
      hegicInversLongCondor20ETH,
      hegicInversLongCondor20BTC,
      pricerETH,
      pricerBTC,
      BasePriceCalculator_CALL_ETH,
      PriceCalculatorOTM_CALL_110_ETH,
      BasePriceCalculator_PUT_ETH,
      PriceCalculatorOTM_PUT_90_ETH,
      PriceCalculatorOTM_CALL_120_ETH,
      PriceCalculatorOTM_PUT_80_ETH,
      BasePriceCalculator_CALL_BTC,
      PriceCalculatorOTM_CALL_110_BTC,
      BasePriceCalculator_PUT_BTC,
      PriceCalculatorOTM_PUT_90_BTC,
      PriceCalculatorOTM_CALL_120_BTC,
      PriceCalculatorOTM_PUT_80_BTC,
    } = contracts

    await pricerETH.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)
    await pricerBTC.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)

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
    await PriceCalculatorOTM_CALL_120_ETH.setDiscount([
      "-90449152247047500000000000000",
      "281111174322857000000000",
      "-64832807237931600",
      "6653609441",
      "0",
    ])
    await PriceCalculatorOTM_PUT_80_ETH.setDiscount([
      "40765559061140100000000000000",
      "68665984989435200000000",
      "10606736546977600",
      "-385641293",
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
    await PriceCalculatorOTM_CALL_120_BTC.setDiscount([
      "20817144661907200000000000000",
      "21836992654709700000000",
      "19541890130668700",
      "-1236943206",
      "0",
    ])
    await PriceCalculatorOTM_PUT_80_BTC.setDiscount([
      "-3658466530632150000000000000",
      "150679323023981000000000",
      "-25816905915842800",
      "2793952642",
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
      hegicInversLongCondor20ETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicInversLongCondor20BTC.address,
      ethers.constants.MaxUint256,
    )
    await contracts.ethPriceFeed.setPrice(5000e8)
    await contracts.btcPriceFeed.setPrice(50000e8)
  })

  describe("ETH: Premium, Collateralization, setLimit, periods", async () => {
    it("Should Calculate Correct Option Price & Collateralization", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(41.734004e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(240.690636e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10240.690636e6)
      await expect(sended_collaterial).to.be.eq(
        await HegicInverseOperationalTreasury.lockedPremium(),
      )
    })

    it("Should unlock option's premium and collateralization when is expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9958.265996e6)
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
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("41.734003", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversLongCondor20ETH
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
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("41.734005", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversLongCondor20ETH
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
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("41.734005", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversLongCondor20ETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            24 * 3600 * 7 - 1,
            BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too short")
    })
    it("Should revert transaction when exercise price = central strike [1]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
        hegicInversLongCondor20ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("Invalid strike = Current price")
    })

    it("Should revert transaction when exercise price = OTM_C1 [2]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let exercise_price = 1553.33552e8
      await ethPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversLongCondor20ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transaction when exercise price = OTM_P1 [4]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let exercise_price = 1270.91088e8
      await ethPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversLongCondor20ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })
    it("Should revert transaction when exercise price > central strike [6]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
        hegicInversLongCondor20ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })
    it("Should revert transaction when exercise price < central strike [7]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
        hegicInversLongCondor20ETH.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })
  })

  describe("ETH: Call-Leg Pay-Off Check", async () => {
    it("Should correct exercise option when exercise price = hedge strike [3]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
      let exercise_price = 1694.54784e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10240.690636e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [10]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
      await hegicInversLongCondor20ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10240.690636e6)
      await expect(alice_balance_changed).to.be.eq(0e6)
    })

    it("Should correct exercise option when exercise price < hedge strike [8]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
      //   .mul(BN.from(115))
      //   .div(BN.from(100))
      let exercise_price = 1600e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10051.594956e6)
      await expect(alice_balance_changed).to.be.eq(189.09568e6)
    })
  })

  describe("ETH: Put-Leg Pay-Off Check", async () => {
    it("Should correct exercise option when exercise price = hedge strike [5]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
      let exercise_price = 1129.69856e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10240.690636e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [11]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
      let exercise_price = 10e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10240.690636e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [9]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicInversLongCondor20ETH,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20ETH.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 1412.1232e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20ETH
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
      //   .mul(BN.from(85))
      //   .div(BN.from(100))
      let exercise_price = 1200e8
      await ethPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20ETH.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20ETH.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10100.087756e6)
      await expect(alice_balance_changed).to.be.eq(140.60288e6)
    })
  })

  describe("BTC: Premium, Collateralization, setLimit, periods", async () => {
    it("Should Calculate Correct Option Price & Collateralization", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let alice_balance_before_sell = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(542.171308e6)
      await expect(
        await HegicInverseOperationalTreasury.lockedPremium(),
      ).to.be.eq(3242.428692e6)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(13242.428692e6)
      await expect(sended_collaterial).to.be.eq(
        await HegicInverseOperationalTreasury.lockedPremium(),
      )
    })

    it("Should unlock option's premium and collateralization when is expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9457.828692e6)
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
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("41.734003", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversLongCondor20BTC
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
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("41.734005", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversLongCondor20BTC
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
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("41.734005", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicInversLongCondor20BTC
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

  describe("BTC: Call-Leg Pay-Off Check", async () => {
    it("Should correct exercise option when exercise price = hedge strike [3]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
      //   .mul(BN.from(120))
      //   .div(BN.from(100))
      let exercise_price = 22707.6e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(13242.428692e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [10]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
      let exercise_price = 100000e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(13242.428692e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [8]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
      //   .mul(BN.from(115))
      //   .div(BN.from(100))
      let exercise_price = 21000e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(9827.228692e6)
      await expect(alice_balance_changed).to.be.eq(3415.2e6)
    })

    it("Should revert transaction when exercise price = central strike [1]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
        hegicInversLongCondor20BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("Invalid strike = Current price")
    })

    it("Should revert transaction when exercise price < OTM_C1 [6]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
        hegicInversLongCondor20BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transaction when exercise price = OTM_C1 [2]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600 * 7,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          0,
        )
      let exercise_price = 20815.3e8
      await btcPriceFeed.setPrice(exercise_price)
      await expect(
        hegicInversLongCondor20BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })
  })

  describe("BTC: Put-Leg Pay-Off Check", async () => {
    it("Should correct exercise option when exercise price = hedge strike [5]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
      //   .mul(BN.from(80))
      //   .div(BN.from(100))
      let exercise_price = 15138.4e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(13242.428692e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price < hedge strike [11]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
      let exercise_price = 10e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(13242.428692e6)
      await expect(alice_balance_changed).to.be.eq(0)
    })

    it("Should correct exercise option when exercise price > hedge strike [9]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
      //   .mul(BN.from(85))
      //   .div(BN.from(100))
      let exercise_price = 16500e8
      await btcPriceFeed.setPrice(exercise_price)
      await hegicInversLongCondor20BTC.connect(deployer).exercise(0)
      let alice_balance_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let alice_balance_changed = alice_balance_after_exercise.sub(
        alice_balance_before_exercise,
      )
      await expect(
        await HegicInverseOperationalTreasury.lockedByStrategy(
          hegicInversLongCondor20BTC.address,
        ),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalLocked(),
      ).to.be.eq(0)
      await expect(
        await HegicInverseOperationalTreasury.totalBalance(),
      ).to.be.eq(10519.228692e6)
      await expect(alice_balance_changed).to.be.eq(2723.2e6)
    })

    it("Should revert transaction when exercise price > OTM_P1 [7]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
        hegicInversLongCondor20BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transaction when exercise price = OTM_P1 [4]", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicInversLongCondor20BTC,
        HegicInverseOperationalTreasury,
      } = contracts
      await hegicInversLongCondor20BTC.setLimit(
        ethers.utils.parseUnits("10000", await contracts.USDC.decimals()),
      )
      let strike_price = 18923e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicInversLongCondor20BTC
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
        hegicInversLongCondor20BTC.connect(deployer).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })
  })
})
