import {ethers} from "hardhat"
import list from "./transfer_list.json"
;(async function () {
  const res = await ethers
    .getContract("HegicStakeAndCoverDistributor")
    .then((x) => x.distribute(list.slice(200)))
  console.log(await res)
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
