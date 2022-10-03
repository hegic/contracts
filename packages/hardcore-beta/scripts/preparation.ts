// import chai from "chai"
import {AggregatorV3Interface} from "../typechain/AggregatorV3Interface"
import {Erc20Mock as ERC20} from "../typechain/Erc20Mock"
import {HegicOperationalTreasury} from "../typechain/HegicOperationalTreasury"
import {HegicStakeAndCover} from "../typechain/HegicStakeAndCover"
import {ethers} from "hardhat"

const hre = require("hardhat")
//
// import {HegicStrategyStrip} from "../typechain/HegicStrategyStrip"
// import {PriceCalculator} from "../typechain/PriceCalculator"
// import {AggregatorV3Interface} from "../typechain/AggregatorV3Interface"
// import {Erc20Mock as ERC20} from "../typechain/Erc20Mock"
// import {HegicOperationalTreasury} from "../typechain/HegicOperationalTreasury"
async function main() {
  const fixture = hre.deployments.createFixture(async ({}) => {
    const [deployer, alice] = await ethers.getSigners()

    return {
      deployer,
      alice,
      hegicStakeAndCover: (await ethers.getContract(
        "HegicStakeAndCover",
      )) as HegicStakeAndCover,
      // hegicStraddleETH: (await ethers.getContract(
      //   "HegicStrategyStraddleETH",
      // )) as HegicStrategyStraddle,
      // hegicStraddleBTC: (await ethers.getContract(
      //   "HegicStrategyStraddleBTC",
      // )) as HegicStrategyStraddle,
      USDC: (await ethers.getContract("USDC")) as ERC20,
      HEGIC: (await ethers.getContract("HEGIC")) as ERC20,
      WETH: (await ethers.getContract("WETH")) as ERC20,
      WBTC: (await ethers.getContract("WBTC")) as ERC20,
      // pricerETH: (await ethers.getContract(
      //   "PriceCalculatorStraddleETH",
      // )) as PriceCalculator,
      // pricerBTC: (await ethers.getContract(
      //   "PriceCalculatorStraddleBTC",
      // )) as PriceCalculator,
      ethPriceFeed: (await ethers.getContract(
        "PriceProviderETH",
      )) as AggregatorV3Interface,
      btcPriceFeed: (await ethers.getContract(
        "PriceProviderBTC",
      )) as AggregatorV3Interface,
      HegicOperationalTreasury: (await ethers.getContract(
        "HegicOperationalTreasury",
      )) as HegicOperationalTreasury,
      // hegicOTM_CALL_110_ETH: (await ethers.getContract(
      //   "HegicStrategyOTM_CALL_110_ETH",
      // )) as HegicStrategyCall,
      // hegicOTM_PUT_90_ETH: (await ethers.getContract(
      //   "HegicStrategyOTM_PUT_90_ETH",
      // )) as HegicStrategyPut,
      // hegicOTM_PUT_90_BTC: (await ethers.getContract(
      //   "HegicStrategyOTM_PUT_90_BTC",
      // )) as HegicStrategyPut,
      // hegicOTM_CALL_110_BTC: (await ethers.getContract(
      //   "HegicStrategyOTM_CALL_110_BTC",
      // )) as HegicStrategyCall,
      // hegicStrategyStripETH: (await ethers.getContract(
      //   "HegicStrategyStripETH",
      // )) as HegicStrategyStrip,
    }
  })

  let contracts: Awaited<ReturnType<typeof fixture>>

  contracts = await fixture()
  const {
    alice,
    deployer,
    hegicStraddleETH,
    hegicStraddleBTC,
    hegicStrategyStripETH,
    hegicOTM_CALL_110_ETH,
    hegicOTM_PUT_90_ETH,
    hegicOTM_PUT_90_BTC,
    hegicOTM_CALL_110_BTC,
    USDC,
    HEGIC,
    HegicOperationalTreasury,
    ethPriceFeed,
    btcPriceFeed,
    hegicStakeAndCover,
  } = contracts

  await USDC.mintTo(
    HegicOperationalTreasury.address,
    hre.ethers.utils.parseUnits("1000000000000000", await USDC.decimals()),
  )
  await HegicOperationalTreasury.addTokens()

  await USDC.mintTo(
    await alice.getAddress(),
    ethers.utils.parseUnits("1000000000000000", await USDC.decimals()),
  )

  await HEGIC.mintTo(
    hegicStakeAndCover.address,
    ethers.utils.parseUnits("100000000"),
  )
  await USDC.mintTo(hegicStakeAndCover.address, "1000000000000")
  await hegicStakeAndCover.saveFreeTokens()
  console.log(await hegicStakeAndCover.totalBalance())

  await hegicStakeAndCover.transferShare(
    await ethers.getSigners().then((x) => x[1].getAddress()),
    ethers.utils.parseUnits("59000000"),
  )
  await hegicStakeAndCover.transferShare(
    await ethers.getSigners().then((x) => x[2].getAddress()),
    ethers.utils.parseUnits("12300000"),
  )
  //
  // await USDC.connect(alice).approve(
  //   hegicStraddleETH.address,
  //   ethers.constants.MaxUint256,
  // )
  // await USDC.connect(alice).approve(
  //   hegicStraddleBTC.address,
  //   ethers.constants.MaxUint256,
  // )
  // await USDC.connect(alice).approve(
  //   hegicOTM_CALL_110_ETH.address,
  //   hre.ethers.constants.MaxUint256,
  // )
  // await USDC.connect(alice).approve(
  //   hegicOTM_PUT_90_ETH.address,
  //   hre.ethers.constants.MaxUint256,
  // )
  // await USDC.connect(alice).approve(
  //   hegicOTM_PUT_90_BTC.address,
  //   hre.ethers.constants.MaxUint256,
  // )
  // await USDC.connect(alice).approve(
  //   hegicOTM_CALL_110_BTC.address,
  //   hre.ethers.constants.MaxUint256,
  // )
  // await USDC.connect(alice).approve(
  //   hegicStrategyStripETH.address,
  //   hre.ethers.constants.MaxUint256,
  // )

  // await ethPriceFeed.setPrice(5000e8)
  // await btcPriceFeed.setPrice(50000e8)

  console.log("Preparation completed!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
