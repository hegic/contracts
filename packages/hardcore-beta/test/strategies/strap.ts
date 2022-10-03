import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {HegicStrategyStrip} from "../../typechain/HegicStrategyStrip"

import {BasePriceCalculator} from "../../typechain/BasePriceCalculator"
import {AggregatorV3Interface} from "../../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../../typechain/HegicOperationalTreasury"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["single-strap"])

  const [deployer, alice] = await ethers.getSigners()

  return {
    deployer,
    alice,
    hegicStrapETH: (await ethers.getContract(
      "HegicStrategySTRAP_ETH",
    )) as HegicStrategyStrip,
    hegicStrapBTC: (await ethers.getContract(
      "HegicStrategySTRAP_BTC",
    )) as HegicStrategyStrip,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    WETH: (await ethers.getContract("WETH")) as ERC20,
    WBTC: (await ethers.getContract("WBTC")) as ERC20,
    pricerETH: (await ethers.getContract(
      "PriceCalculatorSTRAP_ETH",
    )) as BasePriceCalculator,
    pricerBTC: (await ethers.getContract(
      "PriceCalculatorSTRAP_BTC",
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

describe("HegicPoolStrap", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>

  beforeEach(async () => {
    contracts = await fixture()
    const {alice, hegicStrapETH, hegicStrapBTC, pricerETH, pricerBTC} =
      contracts

    await pricerETH.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)
    await pricerBTC.setPeriodLimits(1 * 24 * 3600, 30 * 24 * 3600)

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
      hegicStrapETH.address,
      ethers.constants.MaxUint256,
    )
    await contracts.USDC.connect(alice).approve(
      hegicStrapBTC.address,
      ethers.constants.MaxUint256,
    )
    await contracts.ethPriceFeed.setPrice(5000e8)
    await contracts.btcPriceFeed.setPrice(50000e8)
  })

  describe("ETH", async () => {
    it("call exercised amount", async () => {
      const {
        alice,
        USDC,
        WETH,
        ethPriceFeed,
        hegicStrapETH,
        pricerETH,
        deployer,
      } = contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 5000e8
      let new_price = 7000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrapETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("0.3535", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600 - 30 * 60 + 1])
      let txExercise = await hegicStrapETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(1414e6)
    })

    it("put exercised amoun", async () => {
      const {
        alice,
        USDC,
        WETH,
        ethPriceFeed,
        hegicStrapETH,
        pricerETH,
        deployer,
      } = contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 5000e8
      let new_price = 3000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrapETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("0.3535", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600 - 30 * 60 + 1])
      let txExercise = await hegicStrapETH.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(707e6)
    })

    it("null exercised amount", async () => {
      const {
        alice,
        USDC,
        WETH,
        ethPriceFeed,
        hegicStrapETH,
        pricerETH,
        deployer,
      } = contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 9000e8
      let new_price = 9000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrapETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("0.3535", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600 - 30 * 60 + 1])
      await expect(hegicStrapETH.connect(alice).exercise(0)).to.be.reverted
    })

    it("itm expired exercised amount", async () => {
      const {
        alice,
        USDC,
        WETH,
        ethPriceFeed,
        hegicStrapETH,
        pricerETH,
        deployer,
      } = contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 8000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrapETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("0.3535", await WETH.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await ethPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600])
      await expect(hegicStrapETH.connect(alice).exercise(0)).to.be.reverted
    })

    it("less then min period", async () => {
      const {alice, WETH, ethPriceFeed, hegicStrapETH, pricerETH, deployer} =
        contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let strike_price = 3000e8
      let new_price = 8000e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicStrapETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86399,
            BN.from(ethers.utils.parseUnits("0.3535", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too short")
    })

    it("more then max period", async () => {
      const {alice, WETH, ethPriceFeed, hegicStrapETH, pricerETH, deployer} =
        contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let strike_price = 3000e8
      let new_price = 8000e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicStrapETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 30 + 1,
            BN.from(ethers.utils.parseUnits("0.3535", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too long")
    })

    it("locked amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicStrapETH,
        HegicOperationalTreasury,
        pricerETH,
        BasePriceCalculator_PUT_ETH,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
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
      let strike_price = 5000e8
      let new_price = 7000e8
      await ethPriceFeed.setPrice(strike_price)
      await hegicStrapETH
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 9,
          BN.from(ethers.utils.parseUnits("3.45", await WETH.decimals())),
          0,
        )
      expect(
        await HegicOperationalTreasury.lockedByStrategy(hegicStrapETH.address),
      ).to.be.eq(BN.from(1958.261492e6))
    })

    it("exceeds the limit", async () => {
      const {
        alice,
        deployer,
        USDC,
        WETH,
        ethPriceFeed,
        hegicStrapETH,
        HegicOperationalTreasury,
        pricerETH,
        BasePriceCalculator_PUT_ETH,
        BasePriceCalculator_CALL_ETH,
      } = contracts
      await hegicStrapETH.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
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
      let strike_price = 5000e8
      let new_price = 7000e8
      await ethPriceFeed.setPrice(strike_price)
      await expect(
        hegicStrapETH
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 30,
            BN.from(ethers.utils.parseUnits("1065", await WETH.decimals())),
            0,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })
  })

  describe("BTC", async () => {
    it("call exercised amount", async () => {
      const {
        alice,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicStrapBTC,
        pricerBTC,
        deployer,
      } = contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 40000e8
      let new_price = 50000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrapBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400,
          BN.from(ethers.utils.parseUnits("1.54", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [86400 - 30 * 60 + 1])
      let txExercise = await hegicStrapBTC.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(30800e6)
    })

    it("put exercised amoun", async () => {
      const {
        alice,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicStrapBTC,
        pricerBTC,
        deployer,
      } = contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 50000e8
      let new_price = 40000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrapBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1.54", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600 - 30 * 60 + 1])
      let txExercise = await hegicStrapBTC.connect(alice).exercise(0)
      let balance_alice_after_exercise = await USDC.balanceOf(
        await alice.getAddress(),
      )
      let exercised_amount =
        balance_alice_after_exercise.sub(balance_alice_after)
      await expect(exercised_amount).to.be.eq(15400e6)
    })

    it("null exercised amount", async () => {
      const {
        alice,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicStrapBTC,
        pricerBTC,
        deployer,
      } = contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 9000e8
      let new_price = 9000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrapBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600 - 30 * 60 + 1])
      await expect(hegicStrapBTC.connect(alice).exercise(0)).to.be.reverted
    })

    it("itm expired exercised amount", async () => {
      const {
        alice,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicStrapBTC,
        pricerBTC,
        deployer,
      } = contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let balance_alice_before = await USDC.balanceOf(await alice.getAddress())
      let strike_price = 3000e8
      let new_price = 8000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrapBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          24 * 3600,
          BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
          0,
        )
      let balance_alice_after = await USDC.balanceOf(await alice.getAddress())
      await btcPriceFeed.setPrice(new_price)

      await ethers.provider.send("evm_increaseTime", [24 * 3600])
      await expect(hegicStrapBTC.connect(alice).exercise(0)).to.be.reverted
    })

    it("less then min period", async () => {
      const {alice, WBTC, btcPriceFeed, hegicStrapBTC, pricerBTC, deployer} =
        contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let strike_price = 3000e8
      let new_price = 8000e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicStrapBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86399,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too short")
    })

    it("more then max period", async () => {
      const {alice, WBTC, btcPriceFeed, hegicStrapBTC, pricerBTC, deployer} =
        contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      let strike_price = 3000e8
      let new_price = 8000e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicStrapBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 30 + 1,
            BN.from(ethers.utils.parseUnits("1", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("PriceCalculator: The period is too long")
    })

    it("locked amount", async () => {
      const {
        alice,
        deployer,
        USDC,
        WBTC,
        btcPriceFeed,
        hegicStrapBTC,
        HegicOperationalTreasury,
        pricerBTC,
        BasePriceCalculator_PUT_BTC,
        BasePriceCalculator_CALL_BTC,
      } = contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
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
      let strike_price = 5000e8
      let new_price = 7000e8
      await btcPriceFeed.setPrice(strike_price)
      await hegicStrapBTC
        .connect(alice)
        .buy(
          await alice.getAddress(),
          86400 * 9,
          BN.from(ethers.utils.parseUnits("3.45", await WBTC.decimals())),
          0,
        )
      expect(
        await HegicOperationalTreasury.lockedByStrategy(hegicStrapBTC.address),
      ).to.be.eq(BN.from(16877.074074e6))
    })

    it("exceeds the limit", async () => {
      const {
        alice,
        deployer,
        WBTC,
        btcPriceFeed,
        hegicStrapBTC,
        BasePriceCalculator_PUT_BTC,
        BasePriceCalculator_CALL_BTC,
      } = contracts
      await hegicStrapBTC.setLimit(
        ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
      )
      await BasePriceCalculator_CALL_BTC.connect(deployer).setCoefficients([
        "942999999999999948100982068477952",
        "925999999999999946883334144",
        "-137000000000000000000",
        "11800000000000",
        "0",
      ])
      await BasePriceCalculator_PUT_BTC.connect(deployer).setCoefficients([
        "1121999999999999965452603773419520",
        "814999999999999984715956224",
        "-58500000000000008192",
        "0",
        "0",
      ])
      let strike_price = 5000e8
      let new_price = 7000e8
      await btcPriceFeed.setPrice(strike_price)
      await expect(
        hegicStrapBTC
          .connect(alice)
          .buy(
            await alice.getAddress(),
            86400 * 30,
            BN.from(ethers.utils.parseUnits("200", await WBTC.decimals())),
            0,
          ),
      ).to.be.revertedWith("HegicStrategy: The limit is exceeded")
    })
  })
})
