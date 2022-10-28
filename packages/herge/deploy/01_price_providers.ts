import {HardhatRuntimeEnvironment} from "hardhat/types"
import  PriceProviderAbi from "@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json"

const params = {
  BTCPrice: 29398e8,
  ETHPrice: 1974e8,
}

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, save} = deployments
  const {deployer} = await getNamedAccounts()

  switch (hre.network.name) {
    case "arbitrum":
      save("PriceProviderBTC", {
        address: "0x6ce185860a4963106506C203335A2910413708e9",
        abi: PriceProviderAbi.compilerOutput.abi
      })
      save("PriceProviderETH", {
        address: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
        abi: PriceProviderAbi.compilerOutput.abi,
      })
      return
    case "hardhat":
    case "hlocal":
    case "localhost":
    case "hoffice":
    case "ropsten":
      await deploy("PriceProviderBTC", {
        contract: "PriceProviderMock",
        from: deployer,
        log: true,
        args: [params.BTCPrice, 8],
      })

      await deploy("PriceProviderETH", {
        contract: "PriceProviderMock",
        from: deployer,
        log: true,
        args: [params.ETHPrice, 8],
      })
      break

    default:
      throw new Error("Unsupported network: " + hre.network.name)
  }
}

deployment.tags = ["test", "pricers", "arbitrum"]
export default deployment