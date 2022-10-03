import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStrategyCall} from "../../typechain/HegicStrategyCall"
import {HegicStrategyPut} from "../../typechain/HegicStrategyPut"
import {ScaledPolynomialPriceCalculator} from "../../typechain/ScaledPolynomialPriceCalculator"
import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../../typechain/HegicOperationalTreasury"

function round(spotPrice: number, percent: number, decimals: number) {
  return Math.floor((spotPrice * percent) / 100)
  let otmStrike = ((spotPrice / 1e8) * percent) / 100
  let remainder = otmStrike % decimals
  let strike
  remainder >= decimals / 2
    ? (strike = Math.round(otmStrike / decimals) * decimals)
    : (strike = Math.floor(otmStrike / decimals) * decimals)
  return strike * 1e8
}

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-otm"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicOtmCallETH: (await ethers.getContract(
      "HegicStrategyOTM_CALL_110_ETH",
    )) as HegicStrategyCall,
    hegicOtmCallBTC: (await ethers.getContract(
      "HegicStrategyOTM_CALL_110_BTC",
    )) as HegicStrategyCall,
    hegicOtmPutETH: (await ethers.getContract(
      "HegicStrategyOTM_PUT_90_ETH",
    )) as HegicStrategyPut,
    hegicOtmPutBTC: (await ethers.getContract(
      "HegicStrategyOTM_PUT_90_BTC",
    )) as HegicStrategyPut,

    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,

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
    ethPriceFeed: (await ethers.getContract(
      "PriceProviderETH",
    )) as AggregatorV3Interface,
    btcPriceFeed: (await ethers.getContract(
      "PriceProviderBTC",
    )) as AggregatorV3Interface,
    HegicOperationalTreasury: (await ethers.getContract(
      "HegicOperationalTreasury",
    )) as HegicOperationalTreasury,
  }
})

describe("HegicPoolOTM", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {
      alice,
      hegicOtmCallETH,
      hegicOtmPutETH,
      hegicOtmCallBTC,
      hegicOtmPutBTC,
    } = contracts

    await contracts.USDC.mint(
      contracts.HegicOperationalTreasury.address,
      ethers.utils.parseUnits("1000000000", await contracts.USDC.decimals()),
    )
    await contracts.HegicOperationalTreasury.addTokens()

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits(
        "10000000000000",
        await contracts.USDC.decimals(),
      ),
    )

    await contracts.USDC.connect(alice).approve(
      hegicOtmCallETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicOtmPutETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicOtmCallBTC.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicOtmPutBTC.address,
      ethers.constants.MaxUint256,
    )

    await contracts.ethPriceFeed.setPrice(5000e8)
    await contracts.btcPriceFeed.setPrice(50000e8)
    await contracts.BasePriceCalculator_CALL_BTC.setPeriodLimits(
      24 * 3600 * 7,
      24 * 3600 * 30,
    )
    await contracts.BasePriceCalculator_PUT_BTC.setPeriodLimits(
      24 * 3600 * 7,
      24 * 3600 * 30,
    )
    await contracts.BasePriceCalculator_CALL_ETH.setPeriodLimits(
      24 * 3600 * 7,
      24 * 3600 * 30,
    )
    await contracts.BasePriceCalculator_PUT_ETH.setPeriodLimits(
      24 * 3600 * 7,
      24 * 3600 * 30,
    )
  })

  describe("ETH CALL POOL", async () => {
    it("test polinom", async () => {
      const {ethPriceFeed} = contracts
      let currentPrice = 3200e8
      await ethPriceFeed.setPrice(currentPrice)
    })

    it("exercised amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmCallETH,
        pricerETH_OTM_CALL_110,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await BasePriceCalculator_CALL_ETH.connect(deployer).setCoefficients([
        "44200000000000000822605422526464",
        "194999999999999992970346496",
        "-72199999999999991808",
        "16900000000000",
        "-1510000",
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
      await hegicOtmCallETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      let option_cost = BN.from(136.511124e6)
      expect(balance_diff).to.be.eq(-option_cost)
      await ethPriceFeed.setPrice(8000e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])
      await hegicOtmCallETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      expect(exercised_amount).to.be.eq(BN.from(15456000000))
    })

    it("exercised amount if price below option strike", async () => {
      const {alice, WETH, ethPriceFeed, hegicOtmCallETH} = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmCallETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          strike,
        )
      await ethPriceFeed.setPrice(3499e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      await expect(hegicOtmCallETH.connect(alice).exercise(0)).to.be.reverted
    })

    it("expired", async () => {
      const {alice, WETH, ethPriceFeed, hegicOtmCallETH} = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmCallETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          strike,
        )
      await ethPriceFeed.setPrice(3519e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7])

      await expect(hegicOtmCallETH.connect(alice).exercise(0)).to.be.reverted
    })

    it("options aren't buying is period less then 7 days", async () => {
      const {alice, WETH, ethPriceFeed, hegicOtmCallETH} = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 6 + 86399
      let strike = round(currentPrice, percent, 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmCallETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("options aren't buying is period more then 45 days", async () => {
      const {alice, WETH, ethPriceFeed, hegicOtmCallETH} = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 45 + 1
      let strike = round(currentPrice, percent, 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmCallETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("locked amount", async () => {
      const {
        alice,
        deployer,
        WETH,
        ethPriceFeed,
        hegicOtmCallETH,
        pricerETH_OTM_CALL_110,
        HegicOperationalTreasury,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await BasePriceCalculator_CALL_ETH.connect(deployer).setCoefficients([
        "44200000000000000822605422526464",
        "194999999999999992970346496",
        "-72199999999999991808",
        "16900000000000",
        "-1510000",
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
      await hegicOtmCallETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          strike,
        )
      expect(
        await HegicOperationalTreasury.lockedByStrategy(
          hegicOtmCallETH.address,
        ),
      ).to.be.eq(BN.from(136.511124e6))
    })

    it("exceeds the limit", async () => {
      const {
        alice,
        deployer,
        WETH,
        ethPriceFeed,
        hegicOtmCallETH,
        pricerETH_OTM_CALL_110,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      await hegicOtmCallETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_CALL_ETH.connect(deployer).setCoefficients([
        "44200000000000000822605422526464",
        "194999999999999992970346496",
        "-72199999999999991808",
        "16900000000000",
        "-1510000",
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
      // await hegicOtmCallETH
      // await pricerETH_OTM_CALL_110.connect(deployer).setUtilizationRate(0)
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmCallETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("25273", await WETH.decimals())),
            strike,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })

    it("Should calculate correct profitOf", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmCallETH,
        pricerETH_OTM_CALL_110,
      } = contracts
      await hegicOtmCallETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      // await pricerETH_OTM_CALL_110.connect(deployer).setUtilizationRate(0)
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 30
      let strike = round(currentPrice, percent, 100)
      let new_eth_price = 4500e8
      await pricerETH_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmCallETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("10", await WETH.decimals())),
          strike,
        )
      await ethPriceFeed.setPrice(new_eth_price)
      expect(await hegicOtmCallETH.profitOf(0)).to.be.eq(
        ethers.utils.parseUnits("9800", await USDC.decimals()),
      )
    })

    it("Should lock correct amount of USDC (K value)", async () => {
      const {
        alice,
        deployer,
        WETH,
        ethPriceFeed,
        hegicOtmCallETH,
        pricerETH_OTM_CALL_110,
        HegicOperationalTreasury,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      await hegicOtmCallETH.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_CALL_ETH.connect(deployer).setCoefficients([
        "44200000000000000822605422526464",
        "194999999999999992970346496",
        "-72199999999999991808",
        "16900000000000",
        "-1510000",
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
      // await pricerETH_OTM_CALL_110.connect(deployer).setUtilizationRate(0)
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmCallETH.setK(200)
      await hegicOtmCallETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          strike,
        )
      expect(
        await HegicOperationalTreasury.lockedByStrategy(
          hegicOtmCallETH.address,
        ),
      ).to.be.eq(BN.from(273.022248e6))
    })
  })

  describe("ETH PUT POOL", async () => {
    it("exercised amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        BasePriceCalculator_PUT_ETH,
        pricerETH_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 30
      let strike = round(currentPrice, percent, 100)
      await BasePriceCalculator_PUT_ETH.connect(deployer).setCoefficients([
        "19000000000000000659282848645120",
        "85999999999999999630901248",
        "-29900000000000000000",
        "5060000000000",
        "0",
      ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setDiscount([
          "-38600000000000002217142648832",
          "624000000000000033554432",
          "-246000000000000032",
          "42500000000",
          "-2630",
        ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmPutETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      let option_cost = BN.from(243.922767e6)
      await expect(balance_diff).to.be.eq(-option_cost)
      await ethPriceFeed.setPrice(2000e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      let txExercise = await hegicOtmPutETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(BN.from(3036000000))
    })

    it("exercised amount percent = 80", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
        BasePriceCalculator_PUT_ETH,
      } = contracts
      let percent = 80
      let currentPrice = 3200e8
      let period = 86400 * 22
      let strike = round(currentPrice, percent, 100)
      await BasePriceCalculator_PUT_ETH.connect(deployer).setCoefficients([
        "19000000000000000659282848645120",
        "85999999999999999630901248",
        "-29900000000000000000",
        "5060000000000",
        "0",
      ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setDiscount([
          "-6230000000000000085530247168",
          "129999999999999995805696",
          "-11400000000000000",
          "0",
          "-0",
        ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmPutETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      let option_cost = BN.from(75.22207e6)
      await expect(balance_diff).to.be.eq(-option_cost)
      await ethPriceFeed.setPrice(2000e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      let txExercise = await hegicOtmPutETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(BN.from(1932000000))
    })

    it("exercised amount if price higher option strike", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmPutETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      await ethPriceFeed.setPrice(2901e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      await expect(hegicOtmPutETH.connect(alice).exercise(0)).to.be.reverted
    })

    it("expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmPutETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      await ethPriceFeed.setPrice(2000e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7])

      await expect(hegicOtmPutETH.connect(alice).exercise(0)).to.be.reverted
    })

    it("options aren't buying is period less then 7 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 6 + 86399
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmPutETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("options aren't buying is period more then 45 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 45 + 1
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmPutETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("locked amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
        BasePriceCalculator_PUT_ETH,
        HegicOperationalTreasury,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 22
      let strike = round(currentPrice, percent, 100)

      await BasePriceCalculator_PUT_ETH.setCoefficients([
        "129000000000000005661341348003840",
        "93599999999999994564182016",
        "-6750000000000000000",
        "0",
        "0",
      ])
      await pricerETH_OTM_PUT_90.setDiscount([
        "221000000000000012557276413952",
        "179999999999999991611392",
        "-19700000000000000",
        "0",
        "0",
      ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)

      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await hegicOtmPutETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          strike,
        )
      expect(
        await HegicOperationalTreasury.lockedByStrategy(hegicOtmPutETH.address),
      ).to.be.eq(BN.from(479.529014e6))
    })

    it("exceeds the limit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
        BasePriceCalculator_PUT_ETH,
      } = contracts
      await hegicOtmPutETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_PUT_ETH.connect(deployer).setCoefficients([
        "19000000000000000659282848645120",
        "85999999999999999630901248",
        "-29900000000000000000",
        "5060000000000",
        "0",
      ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setDiscount([
          "-6230000000000000085530247168",
          "129999999999999995805696",
          "-11400000000000000",
          "0",
          "0",
        ])
      // await pricerETH_OTM_PUT_90.connect(deployer).setUtilizationRate(0)
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 22
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      await ethPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmPutETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("45865", await WETH.decimals())),
            strike,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })

    it("Should return correct amount of available contracts for sell", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicOtmPutETH,
        pricerETH_OTM_PUT_90,
        BasePriceCalculator_PUT_ETH,
      } = contracts
      await hegicOtmPutETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_PUT_ETH.connect(deployer).setCoefficients([
        "19000000000000000659282848645120",
        "85999999999999999630901248",
        "-29900000000000000000",
        "5060000000000",
        "0",
      ])
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setDiscount([
          "-6230000000000000085530247168",
          "129999999999999995805696",
          "-11400000000000000",
          "0",
          "0",
        ])
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 22
      let strike = round(currentPrice, percent, 100)
      await pricerETH_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerETH_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutETH.address)
      await ethPriceFeed.connect(deployer).setPrice(currentPrice)

      await hegicOtmPutETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WETH.decimals())),
          strike,
        )
      await expect(
        await hegicOtmPutETH
          .calculatePremium(period, 0, strike)
          .then((x) => x.available),
      ).to.be.eq("45863200322351945545618")
    })
  })

  describe("BTC CALL POOL", async () => {
    it("exercised amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
        BasePriceCalculator_CALL_BTC,
      } = contracts
      let percent = 110
      let currentPrice = 40000e8
      let period = 86400 * 15
      let strike = round(currentPrice, percent, 1000)
      await BasePriceCalculator_CALL_BTC.connect(deployer).setCoefficients([
        "442999999999999975313366574956544",
        "1430000000000000131701145600",
        "-341000000000000000000",
        "39200000000000",
        "0",
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
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmCallBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1.45", await WBTC.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      let option_cost = BN.from(980.160447e6)
      await expect(balance_diff).to.be.eq(-option_cost)
      await btcPriceFeed.setPrice(55499e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      let txExercise = await hegicOtmCallBTC.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(BN.from(16673.55e6))
    })

    it("exercised amount if price below option strike", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
      } = contracts
      let percent = 110
      let currentPrice = 32000e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmCallBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      await btcPriceFeed.setPrice(3499e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      await expect(hegicOtmCallBTC.connect(alice).exercise(0)).to.be.reverted
    })

    it("expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
      } = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmCallBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      await btcPriceFeed.setPrice(3519e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7])

      await expect(hegicOtmCallBTC.connect(alice).exercise(0)).to.be.reverted
    })

    it("options aren't buying is period less then 7 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
      } = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 6 + 86399
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmCallBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("options aren't buying is period more then 45 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
      } = contracts
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 45 + 1
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmCallBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("locked amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
        HegicOperationalTreasury,
        BasePriceCalculator_CALL_BTC,
      } = contracts
      let percent = 110
      let currentPrice = 40000e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await BasePriceCalculator_CALL_BTC.connect(deployer).setCoefficients([
        "442999999999999975313366574956544",
        "1430000000000000131701145600",
        "-341000000000000000000",
        "39200000000000",
        "0",
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
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmCallBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1.45", await WBTC.decimals())),
          strike,
        )
      await expect(
        await HegicOperationalTreasury.lockedByStrategy(
          hegicOtmCallBTC.address,
        ),
      ).to.be.eq(BN.from(404.545327e6))
    })

    it("exceeds the limit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmCallBTC,
        pricerBTC_OTM_CALL_110,
        BasePriceCalculator_CALL_BTC,
      } = contracts
      await hegicOtmCallBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_CALL_BTC.connect(deployer).setCoefficients([
        "442999999999999975313366574956544",
        "1430000000000000131701145600",
        "-341000000000000000000",
        "39200000000000",
        "0",
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
      // await pricerBTC_OTM_CALL_110.connect(deployer).setUtilizationRate(0)
      let percent = 110
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_CALL_110
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_CALL_110.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      await btcPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmCallBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("3585", await WBTC.decimals())),
            strike,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })
  })

  describe("BTC PUT POOL", async () => {
    it("exercised amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
        BasePriceCalculator_PUT_BTC,
      } = contracts
      let percent = 90
      let currentPrice = 40125e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await BasePriceCalculator_PUT_BTC.connect(deployer).setCoefficients([
        "341999999999999984845493511389184",
        "1100000000000000069591891968",
        "-263000000000000032768",
        "30300000000000",
        "0",
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
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmPutBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1.45", await WBTC.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      let option_cost = BN.from(332.948518e6)
      await expect(balance_diff).to.be.eq(-option_cost)
      await btcPriceFeed.setPrice(33000e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      let txExercise = await hegicOtmPutBTC.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(BN.from(4513125000))
    })

    it("exercised amount if price higher option strike", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 32155e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmPutBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      await btcPriceFeed.setPrice(29001e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7 - 30 * 60 + 1])

      await expect(hegicOtmPutBTC.connect(alice).exercise(0)).to.be.reverted
    })

    it("expired", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmPutBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          strike,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      let balance_diff = balance_alice_after.sub(balance_alice_before)
      await btcPriceFeed.setPrice(2000e8)

      await ethers.provider.send("evm_increaseTime", [86400 * 7])

      await expect(hegicOtmPutBTC.connect(alice).exercise(0)).to.be.reverted
    })

    it("options aren't buying is period less then 7 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 6 + 86399
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmPutBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("options aren't buying is period more then 45 days", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
      } = contracts
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 45 + 1
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmPutBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            strike,
          ),
      ).to.be.reverted
    })

    it("locked amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
        HegicOperationalTreasury,
        BasePriceCalculator_PUT_BTC,
      } = contracts
      let percent = 90
      let currentPrice = 40125e8
      let period = 86400 * 7
      let strike = Math.round((currentPrice * percent) / 100)
      await BasePriceCalculator_PUT_BTC.connect(deployer).setCoefficients([
        "341999999999999984845493511389184",
        "1100000000000000069591891968",
        "-263000000000000032768",
        "30300000000000",
        "0",
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
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmPutBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("1.45", await WBTC.decimals())),
          strike,
        )
      await expect(
        await HegicOperationalTreasury.lockedByStrategy(hegicOtmPutBTC.address),
      ).to.be.eq(BN.from(332.948518e6))
    })

    it("Should lock correct amount of USDC (K value)", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
        HegicOperationalTreasury,
        BasePriceCalculator_PUT_BTC,
      } = contracts
      await hegicOtmPutBTC.setLimit(
        ethers.utils.parseUnits("100000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_PUT_BTC.connect(deployer).setCoefficients([
        "341999999999999984845493511389184",
        "1100000000000000069591891968",
        "-263000000000000032768",
        "30300000000000",
        "0",
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
      // await pricerBTC_OTM_PUT_90.connect(deployer).setUtilizationRate(0)
      let percent = 90
      let currentPrice = 32000e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmPutBTC.address)
      await btcPriceFeed.setPrice(currentPrice)
      await hegicOtmPutBTC.setK(200)
      await hegicOtmPutBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          period,
          BN.from(ethers.utils.parseUnits("2", await WBTC.decimals())),
          strike,
        )
      await expect(
        await HegicOperationalTreasury.lockedByStrategy(hegicOtmPutBTC.address),
      ).to.be.eq(BN.from(918.478672e6))
    })

    it("exceeds the limit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicOtmPutBTC,
        pricerBTC_OTM_PUT_90,
        BasePriceCalculator_PUT_BTC,
      } = contracts
      await hegicOtmPutBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_PUT_BTC.connect(deployer).setCoefficients([
        "341999999999999984845493511389184",
        "1100000000000000069591891968",
        "-263000000000000032768",
        "30300000000000",
        "0",
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
      // await pricerBTC_OTM_PUT_90.connect(deployer).setUtilizationRate(0)
      let percent = 90
      let currentPrice = 3200e8
      let period = 86400 * 7
      let strike = round(currentPrice, percent, 1000)
      await pricerBTC_OTM_PUT_90
        .connect(deployer)
        .setPriceCorrectionRate(percent * 100)
      // await pricerBTC_OTM_PUT_90.connect(deployer).setStrategy(hegicOtmCallBTC.address)
      await btcPriceFeed.setPrice(currentPrice)
      await expect(
        hegicOtmPutBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            period,
            BN.from(ethers.utils.parseUnits("4356", await WBTC.decimals())),
            strike,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })
  })
})
