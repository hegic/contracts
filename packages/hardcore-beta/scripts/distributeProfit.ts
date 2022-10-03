import {ethers} from "hardhat"
import {HegicOperationalTreasury} from "../typechain"
import {prompt} from "prompts"

async function distributePoolProfit(poolID: string) {
  const HOT = (await ethers.getContract(poolID)) as HegicOperationalTreasury
  const HSC = await ethers.getContract("HegicStakeAndCover")
  const [benchmark, lockedPremium, totalBalance] = await Promise.all([
    HOT.benchmark(),
    HOT.lockedPremium(),
    HOT.totalBalance(),
  ])
  const transferAmount = totalBalance.sub(benchmark).sub(lockedPremium)

  console.log(
    `Profit of ${poolID}:`,
    ethers.utils.formatUnits(transferAmount, 6),
  )
  
  const {confirmed} = await prompt({
    type: "confirm",
    name: "confirmed",
    message: "Start transaction?",
  })

  if (confirmed)
    if (transferAmount.gt(0)) return HOT.withdraw(HSC.address, transferAmount)
    else if (transferAmount.lt(0)) return HOT.replenish()
}

;(async function () {
  const readOnly = !process.env.WITHDRAW
  await distributePoolProfit("HegicOperationalTreasury").then(
    (x) => x && console.log(x.hash),
  )
  await distributePoolProfit("HegicInverseOperationalTreasury").then(
    (x) => x && console.log(x.hash),
  )
})()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
