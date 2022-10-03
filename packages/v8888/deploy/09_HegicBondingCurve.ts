import {HardhatRuntimeEnvironment} from "hardhat/types"

const BC_PARAMS = {
  ETH: {
    // K: BigInt(1e10),
    K: 8.4e11,
    START_PRICE: 0.00002638e18,
  },
  USDC: {
    // K: BigInt(1e21),
    K: "2" + "0".repeat(20),
    START_PRICE: 0.11e6,
  },
}

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get} = deployments
  const {deployer} = await getNamedAccounts()

  const ETHBondingCurve = await deploy("ETHBondingCurve", {
    from: deployer,
    log: true,
    args: [
      (await get("HEGIC")).address,
      BC_PARAMS.ETH.K,
      BC_PARAMS.ETH.START_PRICE,
    ],
  })

  const USDCBondingCurve = await deploy("USDCBondingCurve", {
    contract: "Erc20BondingCurve",
    from: deployer,
    log: true,
    args: [
      (await get("HEGIC")).address,
      (await get("USDC")).address,
      BC_PARAMS.USDC.K,
      BC_PARAMS.USDC.START_PRICE,
    ],
  })

  // await deploy("BuySell", {
  //   from: deployer,
  //   log: true,
  //   args: [
  //     USDCBondingCurve.address,
  //     ETHBondingCurve.address,
  //   ]
  // })
}

deployment.tags = ["test", "HBC"]
deployment.dependencies = ["tokens"]

export default deployment
