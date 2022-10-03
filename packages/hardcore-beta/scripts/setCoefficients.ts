import {ethers} from "hardhat"
import {BigNumberish, BigNumber} from "ethers"
import {BasePriceCalculator} from "../typechain/BasePriceCalculator"
import {ScaledPolynomialPriceCalculator} from "../typechain/ScaledPolynomialPriceCalculator"
import yaml from "yaml"
import fs from "fs"

type PolynomialCoefficients = [
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
]

async function main() {
  const {coefficients, discounts} = yaml.parse(
    fs.readFileSync(".coefficients.yml").toString(),
  ) as {
    coefficients: {[key: string]: PolynomialCoefficients}
    discounts: {[key: string]: PolynomialCoefficients}
  }

  const PriceController = await ethers.getContract("PriceController")

  for (let r of Object.keys(discounts)) {
    const newCoefficients = discounts[r]
    const bpc = (await ethers.getContract(r)) as ScaledPolynomialPriceCalculator
    const isActual = (
      await Promise.all(
        [0, 1, 2, 3, 4].map((x) =>
          bpc.discount(x).then((v: BigNumber) => v.eq(newCoefficients[x])),
        ),
      )
    ).reduce((x: boolean, y: boolean) => x && y)

    if (!isActual) {
      // const tx = await bpc.setDiscount(discounts[r])
      const tx = await PriceController.setDiscount(bpc.address, discounts[r])
      console.log(r, "\t", tx.hash)
    } else {
      console.log(r, "\t", "equal")
    }
  }

  for (let r of Object.keys(coefficients)) {
    const newCoefficients = coefficients[r]
    const bpc = (await ethers.getContract(r)) as BasePriceCalculator
    const isActual = (
      await Promise.all(
        [0, 1, 2, 3, 4].map((x) =>
          bpc.coefficients(x).then((v: BigNumber) => v.eq(newCoefficients[x])),
        ),
      )
    ).reduce((x: boolean, y: boolean) => x && y)

    if (!isActual) {
      // const tx = await bpc.setCoefficients(coefficients[r])
      const tx = await PriceController.setCoefficients(
        bpc.address,
        coefficients[r],
      )
      console.log(r, "\t", tx.hash)
    } else {
      console.log(r, "\t", "equal")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
