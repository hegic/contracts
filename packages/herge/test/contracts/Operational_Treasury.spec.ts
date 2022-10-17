import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes} from "ethers/lib/utils"
import {constants} from "ethers"
import {timeAndMine, ethers as e2} from "hardhat"
import {parse} from "path"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000"
const OPTInitialBalance = parseUnits("100000", 6)

describe("Operational Pool", () => {
  let testData: Fixture
  const ethAmount = parseUnits("1")
  const btcAmount = parseUnits("1", 8)

  const period = 86400 * 7
  const ethSpotPrice = parseUnits("1000", 8)
  const btcSpotPrice = parseUnits("20000", 8)

  beforeEach(async () => {
    const {
      PriceProviderETH,
      OptionsManager,
      OperationalTreasury,
      HEGIC,
      CoverPool,
      USDC,
      payoffPool,
      signers: [deployer, alice, bob, carl],
      strategies,
      PriceProviderBTC,
    } = (testData = await fixture())

    await CoverPool.grantRole(DEFAULT_ADMIN_ROLE, carl.address)

    await HEGIC.mint(carl.address, parseUnits("1000000000000"))
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
    await CoverPool.connect(carl).provide(parseUnits("1000000000000"), 0)
    await CoverPool.connect(bob).provide(parseUnits("50"), 0)

    await CoverPool.grantRole(
      OPERATIONAL_TRESUARY_ROLE,
      OperationalTreasury.address,
    )

    await OptionsManager.grantRole(
      await OptionsManager.HEGIC_POOL_ROLE(),
      OperationalTreasury.address,
    )

    await USDC.mint(OperationalTreasury.address, OPTInitialBalance)
    await USDC.mint(alice.address, parseUnits("10000000000000"))

    let benchmark = 100000e6
    await OperationalTreasury.connect(deployer).setBenchmark(benchmark)

    await USDC.connect(alice).approve(
      OperationalTreasury.address,
      parseUnits("10000000000000"),
    )

    await PriceProviderBTC.setPrice(btcSpotPrice)
    await PriceProviderETH.setPrice(ethSpotPrice)
    await OperationalTreasury.connect(alice).buy(
      strategies.HegicStrategy_PUT_100_ETH.address,
      alice.address,
      ethAmount,
      period,
      [],
    )
  })

  describe("Should correct calculate option cost", () => {
    describe("ETH", () => {
      it("ATM-CALL", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("90.043457", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_100_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("ATM-PUT", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("90.043457", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_100_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-CALL-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("22.823312", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_110_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-CALL-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("6.315356", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_120_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-CALL-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("2.914897", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_130_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-PUT-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("27.347324", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_90_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-PUT-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("10.672086", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_80_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-PUT-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("4.180970", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_70_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Straddle", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("180.086914", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRADDLE_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Strangle-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("50.170636", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRANGLE_10_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Strangle-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("16.987442", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRANGLE_20_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Strangle-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("7.095867", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRANGLE_30_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bull-Call-Spread-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("71.784807", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_CALL_10_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bull-Call-Spread-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("84.991172", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_CALL_20_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bull-Call-Spread-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("87.711539", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_CALL_30_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Put-Spread-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("68.165597", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_PUT_10_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Put-Spread-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("81.505788", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_PUT_20_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Put-Spread-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("86.698681", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_PUT_30_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Call-Spread-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
          pricers,
        } = testData

        const optionCost = parseUnits("59.667913", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
            alice.address,
            ethAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })
    })

    describe("BTC", () => {
      it("ATM-CALL", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("897.721701", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_100_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("ATM-PUT", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("897.721701", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_100_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-CALL-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("157.259098", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_110_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-CALL-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("41.329950", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_120_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-CALL-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("27.393656", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_CALL_130_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-PUT-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("215.230459", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_90_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-PUT-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("57.945816", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_80_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("OTM-PUT-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("29.978034", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_PUT_70_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Straddle", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("1795.443402", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRADDLE_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Strangle-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("372.489557", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRANGLE_10_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Strangle-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("99.275766", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRANGLE_20_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Strangle-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("57.371690", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_STRANGLE_30_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bull-Call-Spread-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("771.914422", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_CALL_10_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bull-Call-Spread-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("864.657741", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_CALL_20_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bull-Call-Spread-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("875.806776", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_CALL_30_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Put-Spread-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("725.537333", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_PUT_10_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Put-Spread-20%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("851.365048", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_PUT_20_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Put-Spread-30%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("873.739273", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_SPREAD_PUT_30_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })

      it("Bear-Call-Spread-10%", async () => {
        const {
          OperationalTreasury,
          strategies,
          signers: [, alice, ,],
          USDC,
        } = testData

        const optionCost = parseUnits("1555.722439", 6)

        await expect(() =>
          OperationalTreasury.connect(alice).buy(
            strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
            alice.address,
            btcAmount,
            period,
            [],
          ),
        ).changeTokenBalances(
          USDC,
          [OperationalTreasury, alice],
          [optionCost, optionCost.mul(-1)],
        )
      })
    })
  })

  describe("Operational Treasury (OPT)", () => {
    it("should lock USDC into Operational Treasury", async () => {
      const {OperationalTreasury, strategies, BasePriceCalculator_PUT_ETH} =
        testData
      const OptionCost = await BasePriceCalculator_PUT_ETH.calculatePremium(
        86400 * 7,
        parseUnits("1"),
        0,
      )
      expect(
        await OperationalTreasury.lockedByStrategy(
          strategies.HegicStrategy_PUT_100_ETH.address,
        ),
      ).to.be.eq(OptionCost)
    })

    it("should unlock USDC when option is expired", async () => {
      const {OperationalTreasury} = testData

      const position = await OperationalTreasury.lockedLiquidity(0)

      await timeAndMine.setTimeIncrease("8d")
      await OperationalTreasury.unlock(0)

      expect(await OperationalTreasury.totalLocked()).to.be.eq(0)
      expect(await OperationalTreasury.totalBalance()).to.be.eq(
        OPTInitialBalance.add(position.positivepnl),
      )
    })

    it("should send USDC to the option holder when option is exercised", async () => {
      const {
        OperationalTreasury,
        signers: [, alice, ,],
        USDC,
        strategies,
        PriceProviderETH,
      } = testData

      const exercisePrice = 800e8
      const expectedProfit = 200e6

      await PriceProviderETH.setPrice(exercisePrice)
      const profit = await strategies.HegicStrategy_PUT_100_ETH.payOffAmount(0)

      expect(profit).to.be.eq(expectedProfit)

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalances(
        USDC,
        [alice, OperationalTreasury],
        [profit, profit.mul(-1)],
      )

      expect(await OperationalTreasury.totalLocked()).to.be.eq(0)
    })

    it("should withdraw USDC from the OPT", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, ,],
        USDC,
      } = testData

      let InitialBalance = await OperationalTreasury.totalBalance()
      await expect(
        async () =>
          await OperationalTreasury.connect(deployer).withdraw(
            alice.address,
            await OperationalTreasury.totalBalance(),
          ),
      ).changeTokenBalance(USDC, alice, InitialBalance)
    })

    it("should replenish", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, ,],
        USDC,
        PriceProviderETH,
      } = testData

      const newPrice = parseUnits("100", 8)
      await PriceProviderETH.setPrice(newPrice)
      await OperationalTreasury.connect(deployer).withdraw(
        alice.address,
        99500e6,
      )

      await expect(() =>
        OperationalTreasury.connect(alice).payOff(0, alice.address),
      ).changeTokenBalance(USDC, alice, 900e6)

      expect(await OperationalTreasury.totalBalance()).to.be.eq(
        await OperationalTreasury.benchmark(),
      )
    })

    it("should set setBenchmark", async () => {
      const {
        OperationalTreasury,
        signers: [deployer, alice, ,],
      } = testData

      const newBenchmark = 100e6
      await expect(
        OperationalTreasury.connect(alice).setBenchmark(newBenchmark),
      ).to.be.reverted //check access
      await OperationalTreasury.connect(deployer).setBenchmark(newBenchmark)
      expect(await OperationalTreasury.benchmark()).to.be.eq(newBenchmark)
    })
  })
})
