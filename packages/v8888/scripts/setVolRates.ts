import {ethers} from "hardhat"
import {BigNumberish} from "ethers"
import {IvlPriceCalculator} from "../typechain/IvlPriceCalculator"
import yaml from "yaml"
import fs from "fs"

async function main() {
  const res = yaml.parse(fs.readFileSync(".ivl.yml").toString()) as {
    [key: string]: BigNumberish
  }

  for (let r of Object.keys(res)) {
    const newCoefficient = res[r]
    const bpc = (await ethers.getContract(r)) as IvlPriceCalculator
    console.log("start", r)
    const ivl = await bpc.impliedVolRate()

    if (!ivl.eq(newCoefficient)) {
      const tx = await bpc.setImpliedVolRate(newCoefficient)
      console.log(`${r} <- ${newCoefficient}:`, tx.hash)
      await tx.wait()
    } else {
      console.log(`${r} <- ${newCoefficient}:`, "is equal")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
