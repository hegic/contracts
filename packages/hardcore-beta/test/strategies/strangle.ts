import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStrategyStrangle} from "../../typechain/HegicStrategyStrangle"

import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../../typechain/HegicOperationalTreasury"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-strangle"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicStrangleETH: (await ethers.getContract(
      "HegicStrategySTRANGLE_10_ETH",
    )) as HegicStrategyStrangle,
    hegicStrangleBTC: (await ethers.getContract(
      "HegicStrategySTRANGLE_10_BTC",
    )) as HegicStrategyStrangle,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,
    pricerETH: (await ethers.getContract(
      "PriceCalculatorSTRANGLE_10_ETH",
    )) as BasePriceCalculator,
    pricerBTC: (await ethers.getContract(
      "PriceCalculatorSTRANGLE_10_BTC",
    )) as BasePriceCalculator,
    otmPricerETHCall: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_ETH",
    )) as BasePriceCalculator,
    otmPricerBTCCall: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_BTC",
    )) as BasePriceCalculator,
    otmPricerETHPut: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_ETH",
    )) as BasePriceCalculator,
    otmPricerBTCPut: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_BTC",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_10_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_CALL_10_ETH: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_ETH",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_PUT_10_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_BTC",
    )) as BasePriceCalculator,
    PriceCalculatorOTM_CALL_10_BTC: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_BTC",
    )) as BasePriceCalculator,
    ethPriceFeed: (await ethers.getContract(
      "PriceProviderETH",
    )) as AggregatorV3Interface,
    btcPriceFeed: (await ethers.getContract(
      "PriceProviderBTC",
    )) as AggregatorV3Interface,
    HegicOperationalTreasury: (await ethers.getContract(
      "HegicOperationalTreasury",
    )) as HegicOperationalTreasury,
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
  }
})

describe("HegicPoolStangle", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {
      alice,
      deployer,
      hegicStrangleETH,
      hegicStrangleBTC,
      pricerETH,
      pricerBTC,
      otmPricerETHCall,
      otmPricerBTCCall,
      otmPricerETHPut,
      otmPricerBTCPut,
    } = contracts

    await pricerETH.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)
    await pricerBTC.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)

    await otmPricerETHCall.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)
    await otmPricerETHPut.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)
    await otmPricerBTCCall.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)
    await otmPricerBTCPut.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)

    await contracts.USDC.mint(
      contracts.HegicOperationalTreasury.address,
      ethers.utils.parseUnits(
        "1000000000000000",
        await contracts.USDC.decimals(),
      ),
    )
    await contracts.HegicOperationalTreasury.addTokens()

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits(
        "1000000000000000",
        await contracts.USDC.decimals(),
      ),
    )

    await contracts.USDC.connect(alice).approve(
      hegicStrangleETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicStrangleBTC.address,
      ethers.constants.MaxUint256,
    )
    await contracts.ethPriceFeed.setPrice(5000e8)
    await contracts.btcPriceFeed.setPrice(50000e8)
  })

  describe("ETH", async () => {
    it("test polinom", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicStrangleETH,
      } = contracts
      await hegicStrangleETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
    })

    it("Should exercise option correct (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicStrangleETH,
      } = contracts
      await hegicStrangleETH.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 4000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrangleETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)

      let txExercise = await hegicStrangleETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(700e6)
    })

    it("Should exercise option correct (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicStrangleETH,
      } = contracts
      await hegicStrangleETH.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 2500e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrangleETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.5", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)

      let txExercise = await hegicStrangleETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(300e6)
    })

    it("Should revert transcation when current price < strike price (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicStrangleETH,
      } = contracts
      await hegicStrangleETH.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let strike_price = 3000e8
      let new_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrangleETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.5", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await expect(
        hegicStrangleETH.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price > strike price (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        ethPriceFeed,
        hegicStrangleETH,
      } = contracts
      await hegicStrangleETH.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let strike_price = 3000e8
      let new_price = 2701e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrangleETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.5", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await expect(
        hegicStrangleETH.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should correct calculate option premium", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETH,
        BasePriceCalculator_CALL_ETH,
        BasePriceCalculator_PUT_ETH,
        PriceCalculatorOTM_PUT_10_ETH,
        PriceCalculatorOTM_CALL_10_ETH,
        hegicStrangleETH,
      } = contracts
      await hegicStrangleETH.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await BasePriceCalculator_CALL_ETH.setCoefficients([
        "110000000000000000498458871988224",
        "108000000000000000335544320",
        "-16000000000000000000",
        "1380000000000",
        "0",
      ])
      await BasePriceCalculator_PUT_ETH.setCoefficients([
        "129000000000000005661341348003840",
        "93599999999999994564182016",
        "-6750000000000000000",
        "0",
        "0",
      ])
      await PriceCalculatorOTM_CALL_10_ETH.setDiscount([
        "125000000000000002485578104832",
        "300000000000000008388608",
        "-64000000000000008",
        "4960000000",
        "0",
      ])
      await PriceCalculatorOTM_PUT_10_ETH.setDiscount([
        "221000000000000012557276413952",
        "179999999999999991611392",
        "-19700000000000000",
        "0",
        "0",
      ])
      let strike_price = 3000e8
      await hegicStrangleETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 20,
          BN.from(ethers.utils.parseUnits("3.5", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let alice_spent = balance_alice_before.sub(balance_alice_after)
      await expect(alice_spent).to.be.eq(876.295569e6)
    })
  })

  describe("BTC", async () => {
    it("Should exercise option correct (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicStrangleBTC,
      } = contracts
      await hegicStrangleBTC.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 40000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrangleBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)

      let txExercise = await hegicStrangleBTC.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(7000e6)
    })

    it("Should exercise option correct (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicStrangleBTC,
      } = contracts
      await hegicStrangleBTC.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 25000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrangleBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.5", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)

      let txExercise = await hegicStrangleBTC.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(3000e6)
    })

    it("Should revert transcation when current price < strike price (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicStrangleBTC,
      } = contracts
      await hegicStrangleBTC.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let strike_price = 30000e8
      let new_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrangleBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.5", await WBTC.decimals())),
          0,
        )
      await btcPriceFeed.setPrice(new_price)
      await expect(
        hegicStrangleBTC.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price > strike price (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicStrangleBTC,
      } = contracts
      await hegicStrangleBTC.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let strike_price = 30000e8
      let new_price = 27001e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrangleBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.5", await WBTC.decimals())),
          0,
        )
      await btcPriceFeed.setPrice(new_price)
      await expect(
        hegicStrangleBTC.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should correct calculate option premium", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTC,
        btcPriceFeed,
        hegicStrangleBTC,
        BasePriceCalculator_CALL_BTC,
        BasePriceCalculator_PUT_BTC,
        PriceCalculatorOTM_CALL_10_BTC,
        PriceCalculatorOTM_PUT_10_BTC,
      } = contracts
      await hegicStrangleBTC.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await BasePriceCalculator_CALL_BTC.setCoefficients([
        "942999999999999948100982068477952",
        "925999999999999946883334144",
        "-137000000000000000000",
        "11800000000000",
        "0",
      ])
      await BasePriceCalculator_PUT_BTC.setCoefficients([
        "1121999999999999965452603773419520",
        "814999999999999984715956224",
        "-58500000000000008192",
        "0",
        "0",
      ])
      await PriceCalculatorOTM_CALL_10_BTC.setDiscount([
        "68599999999999994369432092672",
        "310999999999999993708544",
        "-64800000000000000",
        "5000000000",
        "0",
      ])
      await PriceCalculatorOTM_PUT_10_BTC.setDiscount([
        "147999999999999996469000011776",
        "180999999999999981125632",
        "-19900000000000000",
        "0",
        "0",
      ])

      let strike_price = 30000e8
      await hegicStrangleBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 30,
          BN.from(ethers.utils.parseUnits("2.5", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let alice_spent = balance_alice_before.sub(balance_alice_after)
      await expect(alice_spent).to.be.eq(6893.233933e6)
    })
  })
})
