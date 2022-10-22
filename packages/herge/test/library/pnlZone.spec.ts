import {parseUnits} from "ethers/lib/utils"
import {calculatePNLZone} from "../../lib/pnlZone"

import {expect} from "chai"
import {BigNumber} from "ethers"

describe("Pnl Zones", () => {
  const ethAmount = parseUnits("2")
  const stikePoint = parseUnits("1000", 8)

  it("Long Condor 20%", () => {
    const strategy = "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH"
    const amount = BigNumber.from("1000000000000000000")
    const price_0 = BigNumber.from("132960000000")
    const pospnl = BigNumber.from("113050084")
    const {left, center, right} = calculatePNLZone(
      strategy,
      amount,
      price_0,
      pospnl,
    )
  })

  it("Bull Put Spread", () => {
    const strategy = "HegicStrategy_INVERSE_BULL_PUT_SPREAD_10_ETH"
    const amount = BigNumber.from("1000000000000000000")
    const price_0 = BigNumber.from("132960000000")
    const pospnl = parseUnits("95.342320", 6)
    const {left, center, right} = calculatePNLZone(
      strategy,
      amount,
      price_0,
      pospnl,
    )
  })
})
