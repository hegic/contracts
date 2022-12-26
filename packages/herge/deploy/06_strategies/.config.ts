import fs from "fs"
import {parse} from "yaml"
import {BigNumber} from "ethers"

const res = Object.fromEntries(
  Object.entries(
    parse(fs.readFileSync(`${__dirname}/.params.yml`).toString()),
  ).map(([strategy, value]) => {
    const params = value as {
      periodLimits: [number, number]
      window: number
      limit: number
    }

    return [
      strategy,
      {
        periodLimits: [
          BigNumber.from(params.periodLimits[0]).mul(24 * 3600),
          BigNumber.from(params.periodLimits[1]).mul(24 * 3600),
        ],
        window: params.window && BigNumber.from(params.window).mul(24 * 3600),
        limit: BigNumber.from(params.limit).mul(1e6),
      },
    ]
  }),
)
export default res
