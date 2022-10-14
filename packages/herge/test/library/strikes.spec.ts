import {calculateStrikes} from "../../lib/strikes"
import {parseUnits} from "ethers/lib/utils"
import {expect} from "chai"

describe("Check Strikes", () => {
  describe("Check Strikes for ETH", () => {
    const strikePoint = parseUnits("1000", 8)

    it("HegicStrategy_CALL_100_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_CALL_100_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint])
    })

    it("HegicStrategy_CALL_110_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_CALL_110_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("1100", 8)])
    })

    it("HegicStrategy_CALL_120_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_CALL_120_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("1200", 8)])
    })

    it("HegicStrategy_CALL_130_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_CALL_130_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("1300", 8)])
    })

    it("HegicStrategy_PUT_100_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_PUT_100_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint])
    })

    it("HegicStrategy_PUT_90_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_PUT_90_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("900", 8)])
    })

    it("HegicStrategy_PUT_80_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_PUT_80_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("800", 8)])
    })

    it("HegicStrategy_PUT_70_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_PUT_70_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("700", 8)])
    })

    it("HegicStrategy_STRANGLE_10_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_STRANGLE_10_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("900", 8),
        parseUnits("1100", 8),
      ])
    })

    it("HegicStrategy_STRANGLE_20_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_STRANGLE_20_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("800", 8),
        parseUnits("1200", 8),
      ])
    })

    it("HegicStrategy_STRANGLE_30_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_STRANGLE_30_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("700", 8),
        parseUnits("1300", 8),
      ])
    })

    it("HegicStrategy_STRADDLE_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_STRADDLE_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint])
    })

    it("HegicStrategy_STRAP_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_STRAP_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint])
    })

    it("HegicStrategy_STRIP_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_STRIP_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint])
    })

    it("HegicStrategy_SPREAD_CALL_10_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_SPREAD_CALL_10_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint, parseUnits("1100", 8)])
    })

    it("HegicStrategy_SPREAD_CALL_20_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_SPREAD_CALL_20_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint, parseUnits("1200", 8)])
    })

    it("HegicStrategy_SPREAD_CALL_30_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_SPREAD_CALL_30_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint, parseUnits("1300", 8)])
    })

    it("HegicStrategy_SPREAD_PUT_10_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_SPREAD_PUT_10_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("900", 8), strikePoint])
    })

    it("HegicStrategy_SPREAD_PUT_20_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_SPREAD_PUT_20_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("800", 8), strikePoint])
    })

    it("HegicStrategy_SPREAD_PUT_30_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_SPREAD_PUT_30_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("700", 8), strikePoint])
    })

    it("HegicStrategy_INVERSE_LONG_CONDOR_20_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("1000", 8),
        parseUnits("800", 8),
        parseUnits("900", 8),
        parseUnits("1100", 8),
        parseUnits("1200", 8),
      ])
    })

    it("HegicStrategy_INVERSE_LONG_CONDOR_30_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_LONG_CONDOR_30_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("1000", 8),
        parseUnits("700", 8),
        parseUnits("900", 8),
        parseUnits("1100", 8),
        parseUnits("1300", 8),
      ])
    })

    it("HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("900", 8),
        strikePoint,
        parseUnits("1100", 8),
      ])
    })

    it("HegicStrategy_INVERSE_LONG_BUTTERFLY_20_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_LONG_BUTTERFLY_20_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("800", 8),
        strikePoint,
        parseUnits("1200", 8),
      ])
    })

    it("HegicStrategy_INVERSE_LONG_BUTTERFLY_30_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_LONG_BUTTERFLY_30_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([
        parseUnits("700", 8),
        strikePoint,
        parseUnits("1300", 8),
      ])
    })

    it("HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([strikePoint, parseUnits("1100", 8)])
    })

    it("HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH", async () => {
      const _calculateStrikes = calculateStrikes(
        "HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH",
        strikePoint,
      )

      expect(_calculateStrikes).deep.eq([parseUnits("900", 8), strikePoint])
    })
  })
})
