import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"

import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../../typechain/HegicOperationalTreasury"
import {CombinePriceCalculator} from "../../typechain/CombinePriceCalculator"
import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {ScaledPolynomialPriceCalculator} from "../../typechain/ScaledPolynomialPriceCalculator"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-spread"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicSpreadETHCall: (await ethers.getContract(
      "HegicStrategySPREAD_CALL_110_ETH",
    )) as BasePriceCalculator,
    hegicSpreadBTCCall: (await ethers.getContract(
      "HegicStrategySPREAD_CALL_110_BTC",
    )) as BasePriceCalculator,
    hegicSpreadETHPut: (await ethers.getContract(
      "HegicStrategySPREAD_PUT_90_ETH",
    )) as BasePriceCalculator,
    hegicSpreadBTCPut: (await ethers.getContract(
      "HegicStrategySPREAD_PUT_90_BTC",
    )) as BasePriceCalculator,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,
    pricerETHCall: (await ethers.getContract(
      "PriceCalculatorSPREAD_CALL_110_ETH",
    )) as BasePriceCalculator,
    pricerBTCCall: (await ethers.getContract(
      "PriceCalculatorSPREAD_CALL_110_BTC",
    )) as BasePriceCalculator,
    pricerETHPut: (await ethers.getContract(
      "PriceCalculatorSPREAD_PUT_90_ETH",
    )) as BasePriceCalculator,
    pricerBTCPut: (await ethers.getContract(
      "PriceCalculatorSPREAD_PUT_90_BTC",
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
    ethPriceFeed: (await ethers.getContract(
      "PriceProviderETH",
    )) as AggregatorV3Interface,
    btcPriceFeed: (await ethers.getContract(
      "PriceProviderBTC",
    )) as AggregatorV3Interface,
    HegicOperationalTreasury: (await ethers.getContract(
      "HegicOperationalTreasury",
    )) as HegicOperationalTreasury,

    PriceCalculatorSPREAD_CALL_110_ETH: (await ethers.getContract(
      "PriceCalculatorSPREAD_CALL_110_ETH",
    )) as CombinePriceCalculator,
    PriceCalculatorSPREAD_CALL_110_BTC: (await ethers.getContract(
      "PriceCalculatorSPREAD_CALL_110_BTC",
    )) as CombinePriceCalculator,
    PriceCalculatorSPREAD_PUT_90_ETH: (await ethers.getContract(
      "PriceCalculatorSPREAD_PUT_90_ETH",
    )) as CombinePriceCalculator,
    PriceCalculatorSPREAD_PUT_90_BTC: (await ethers.getContract(
      "PriceCalculatorSPREAD_PUT_90_BTC",
    )) as CombinePriceCalculator,
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
    pricerETH_OTM_CALL_110: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_ETH",
    )) as ScaledPolynomialPriceCalculator,
    pricerBTC_OTM_CALL_110: (await ethers.getContract(
      "PriceCalculatorOTM_CALL_110_BTC",
    )) as ScaledPolynomialPriceCalculator,
    pricerETH_OTM_PUT_90: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_ETH",
    )) as ScaledPolynomialPriceCalculator,
    pricerBTC_OTM_PUT_90: (await ethers.getContract(
      "PriceCalculatorOTM_PUT_90_BTC",
    )) as ScaledPolynomialPriceCalculator,
  }
})

describe("HegicPoolSpread", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {
      alice,
      deployer,
      hegicSpreadETHCall,
      hegicSpreadBTCCall,
      hegicSpreadETHPut,
      hegicSpreadBTCPut,
      pricerETHCall,
      pricerBTCCall,
      pricerETHPut,
      pricerBTCPut,
      otmPricerETHCall,
      otmPricerBTCCall,
      otmPricerETHPut,
      otmPricerBTCPut,
    } = contracts

    await pricerETHCall.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)
    await pricerETHPut.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)
    await pricerBTCCall.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)
    await pricerBTCPut.setPeriodLimits(1 * 24 * 3600, 45 * 24 * 3600)

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
      hegicSpreadETHCall.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicSpreadETHPut.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicSpreadBTCCall.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicSpreadBTCPut.address,
      ethers.constants.MaxUint256,
    )
    await contracts.ethPriceFeed.setPrice(5000e8)
    await contracts.btcPriceFeed.setPrice(50000e8)
  })

  describe("ETH", async () => {
    it("test polinom ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)

      await BasePriceCalculator_CALL_ETH.setCoefficients([
        BN.from("49799999999999994854099824672768"),
        BN.from("220000000000000007046430720"),
        BN.from("-81200000000000000000"),
        BN.from("19000000000000"),
        BN.from("-1700000"),
      ])
    })

    it("Should exercise option correct (CALL) when current price > OTM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 5000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadETHCall.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(300e6)
    })

    it("Should exercise option correct (CALL) when current price < OTM strike and above ATM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 3100e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadETHCall.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(200e6)
    })

    it("Should exercise option correct (PUT) when current price < OTM strike and below ATM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHPut,
      } = contracts
      await hegicSpreadETHPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 2300e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadETHPut.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(600e6)
    })

    it("Should exercise option correct (PUT) when current price > OTM strike and below ATM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHPut,
      } = contracts
      await hegicSpreadETHPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 2800e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("2", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadETHPut.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(400e6)
    })

    it("Should revert transcation when current price = ATM strike price (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadETHCall.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price < ATM strike price (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 2999e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadETHCall.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price = ATM strike price (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHPut,
      } = contracts
      await hegicSpreadETHPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadETHPut.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price > ATM strike price (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHPut,
      } = contracts
      await hegicSpreadETHPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 3001e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadETHPut.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when option is expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 3500e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          0,
        )
      await ethPriceFeed.setPrice(new_price)
      await ethers.provider.send("evm_increaseTime", [24 * 3600])
      await expect(
        hegicSpreadETHCall.connect(alice).exercise(0),
      ).to.be.revertedWith("The option has already expired")
    })

    it("Should calculate correct option price (Call)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
        BasePriceCalculator_CALL_ETH,
        PriceCalculatorSPREAD_CALL_110_ETH,
        pricerETH_OTM_CALL_110,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      PriceCalculatorSPREAD_CALL_110_ETH.setCoefficients([100e3, -80e3])
      await BasePriceCalculator_CALL_ETH.setCoefficients([
        BN.from("110000000000000000498458871988224"),
        BN.from("108000000000000000335544320"),
        BN.from("-16000000000000000000"),
        BN.from("1380000000000"),
        BN.from("0"),
      ])
      await pricerETH_OTM_CALL_110
        .connect(deployer)
        .setDiscount([
          "125000000000000002485578104832",
          "300000000000000008388608",
          "-64000000000000008",
          "4960000000",
          "0",
        ])
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 29,
          BN.from(ethers.utils.parseUnits("2.5", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let option_price = balance_alice_before.sub(balance_alice_after)
      await expect(option_price).to.be.eq(420.854015e6)
    })

    it("Should calculate correct option price (Put)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHPut,
        ethPriceFeed,
        hegicSpreadETHPut,
        BasePriceCalculator_PUT_ETH,
        PriceCalculatorSPREAD_PUT_90_ETH,
        pricerETH_OTM_PUT_90,
      } = contracts
      await hegicSpreadETHPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      PriceCalculatorSPREAD_PUT_90_ETH.setCoefficients([100e3, -80e3])
      await BasePriceCalculator_PUT_ETH.setCoefficients([
        BN.from("129000000000000005661341348003840"),
        BN.from("93599999999999994564182016"),
        BN.from("-6750000000000000000"),
        BN.from("0"),
        BN.from("0"),
      ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setDiscount([
          "221000000000000012557276413952",
          "179999999999999991611392",
          "-19700000000000000",
          "0",
          "0",
        ])
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicSpreadETHPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 26,
          BN.from(ethers.utils.parseUnits("0.6666", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let option_price = balance_alice_before.sub(balance_alice_after)
      await expect(option_price).to.be.eq(117.846098e6)
    })

    it("Should revert transcation when ATM strike > Current Price (Put)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHPut,
        ethPriceFeed,
        hegicSpreadETHPut,
      } = contracts
      await hegicSpreadETHPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let spot_price = 3000e8
      await ethPriceFeed.setPrice(spot_price)
      await expect(
        hegicSpreadETHPut
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 26,
            BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
            3500e8,
          ),
      ).to.be.revertedWith("'PriceCalculator: The strike is invalid")
    })

    it("Should revert transcation when ATM strike < Current Price (Call)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        pricerETHCall,
        ethPriceFeed,
        hegicSpreadETHCall,
      } = contracts
      await hegicSpreadETHCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let spot_price = 3000e8
      await ethPriceFeed.setPrice(spot_price)
      await expect(
        hegicSpreadETHCall
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 26,
            BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
            2500e8,
          ),
      ).to.be.revertedWith("'PriceCalculator: The strike is invalid")
    })
  })

  describe("BTC", async () => {
    it("Should exercise option correct (CALL) when current price > OTM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCCall,
        btcPriceFeed,
        hegicSpreadBTCCall,
      } = contracts
      await hegicSpreadBTCCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 50000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadBTCCall.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(3000e6)
    })

    it("Should exercise option correct (CALL) when current price < OTM strike and above ATM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCCall,
        btcPriceFeed,
        hegicSpreadBTCCall,
      } = contracts
      await hegicSpreadBTCCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 31000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadBTCCall.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(1000e6)
    })

    it("Should exercise option correct (PUT) when current price < OTM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCPut,
        btcPriceFeed,
        hegicSpreadBTCPut,
      } = contracts
      await hegicSpreadBTCPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 50000e8
      let new_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadBTCPut.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(5000e6)
    })

    it("Should exercise option correct (PUT) when current price > OTM strike and below ATM strike ", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCPut,
        btcPriceFeed,
        hegicSpreadBTCPut,
      } = contracts
      await hegicSpreadBTCPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 31000e8
      let new_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)
      let txExercise = await hegicSpreadBTCPut.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(1000e6)
    })

    it("Should revert transcation when current price = ATM strike price (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCPut,
        btcPriceFeed,
        hegicSpreadBTCPut,
      } = contracts
      await hegicSpreadBTCPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      await btcPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadBTCPut.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price > ATM strike price (PUT)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCPut,
        btcPriceFeed,
        hegicSpreadBTCPut,
      } = contracts
      await hegicSpreadBTCPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 30001e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      await btcPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadBTCPut.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price = ATM strike price (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCCall,
        btcPriceFeed,
        hegicSpreadBTCCall,
      } = contracts
      await hegicSpreadBTCCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      await btcPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadBTCCall.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })

    it("Should revert transcation when current price < ATM strike price (CALL)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCCall,
        btcPriceFeed,
        hegicSpreadBTCCall,
      } = contracts
      await hegicSpreadBTCCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      let new_price = 29990e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      await btcPriceFeed.setPrice(new_price)
      await expect(
        hegicSpreadBTCCall.connect(alice).exercise(0),
      ).to.be.revertedWith("HegicStrategy: The profit is zero")
    })
    it("Should calculate correct option price (Call)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCCall,
        btcPriceFeed,
        hegicSpreadBTCCall,
        BasePriceCalculator_CALL_BTC,
        PriceCalculatorSPREAD_CALL_110_BTC,
        pricerBTC_OTM_CALL_110,
      } = contracts
      await hegicSpreadBTCCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      PriceCalculatorSPREAD_CALL_110_BTC.setCoefficients([100e3, -80e3])
      await BasePriceCalculator_CALL_BTC.setCoefficients([
        BN.from("942999999999999948100982068477952"),
        BN.from("925999999999999946883334144"),
        BN.from("-137000000000000000000"),
        BN.from("11800000000000"),
        BN.from("0"),
      ])
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setDiscount([
          "68599999999999994369432092672",
          "310999999999999993708544",
          "-64800000000000000",
          "5000000000",
          "0",
        ])
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCCall
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 15,
          BN.from(ethers.utils.parseUnits("2.5", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let option_price = balance_alice_before.sub(balance_alice_after)
      await expect(option_price).to.be.eq(3397.71809e6)
    })

    it("Should calculate correct option price (Put)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCPut,
        btcPriceFeed,
        hegicSpreadBTCPut,
        BasePriceCalculator_PUT_BTC,
        PriceCalculatorSPREAD_PUT_90_BTC,
        pricerBTC_OTM_PUT_90,
      } = contracts
      await hegicSpreadBTCPut.setLimit(
        ethers.utils.parseUnits("10000000", await USDC.decimals()),
      )
      await BasePriceCalculator_PUT_BTC.setPeriodLimits(86400, 86400 * 45)
      await pricerBTC_OTM_PUT_90.setPeriodLimits(86400, 86400 * 45)
      await PriceCalculatorSPREAD_PUT_90_BTC.setCoefficients([100e3, -80e3])
      await BasePriceCalculator_PUT_BTC.setCoefficients([
        BN.from("1121999999999999965452603773419520"),
        BN.from("814999999999999984715956224"),
        BN.from("-58500000000000008192"),
        BN.from("0"),
        BN.from("0"),
      ])
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setDiscount([
          "147999999999999996469000011776",
          "180999999999999981125632",
          "-19900000000000000",
          "0",
          "0",
        ])
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 30000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicSpreadBTCPut
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 35,
          BN.from(ethers.utils.parseUnits("4.99", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let option_price = balance_alice_before.sub(balance_alice_after)
      await expect(option_price).to.be.eq(8973.661309e6)
    })

    it("Should revert transcation when ATM strike > Current Price (Put)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCPut,
        btcPriceFeed,
        hegicSpreadBTCPut,
      } = contracts
      await hegicSpreadBTCPut.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let spot_price = 30000e8
      await btcPriceFeed.setPrice(spot_price)
      await expect(
        hegicSpreadBTCPut
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 26,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            35000e8,
          ),
      ).to.be.revertedWith("'PriceCalculator: The strike is invalid")
    })

    it("Should revert transcation when ATM strike < Current Price (Call)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        pricerBTCCall,
        btcPriceFeed,
        hegicSpreadBTCCall,
      } = contracts
      await hegicSpreadBTCCall.setLimit(
        ethers.utils.parseUnits("1000000", await USDC.decimals()),
      )
      let spot_price = 30000e8
      await btcPriceFeed.setPrice(spot_price)
      await expect(
        hegicSpreadBTCCall
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 26,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            25000e8,
          ),
      ).to.be.revertedWith("'PriceCalculator: The strike is invalid")
    })
  })
})
