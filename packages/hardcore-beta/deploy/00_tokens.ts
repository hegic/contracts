import {HardhatRuntimeEnvironment} from "hardhat/types"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, network} = hre
  const {deploy, save, getArtifact} = deployments
  const {deployer} = await getNamedAccounts()

  switch (network.name) {
    case "arbitrum":
      save("USDC", {
        address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
        abi: await getArtifact("ERC20").then((x) => x.abi),
      })
      save("HEGIC", {
        address: "0xDFD0DEFcda5A5e0bE436F2d12DC01A045a81fa0c",
        abi: await getArtifact("ERC20").then((x) => x.abi),
      })
      return
    case "hardhat":
    case "localhost":
    case "hlocal":
    case "hoffice":
      await deploy("USDC", {
        contract: "ERC20Mock",
        from: deployer,
        log: true,
        args: ["USDC (Mock)", "USDC", 6],
      })

      await deploy("WETH", {
        contract: "ERC20Mock",
        from: deployer,
        log: true,
        args: ["WETH (Mock)", "WETH", 18],
      })

      await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer,
        log: true,
        args: ["WBTC (Mock)", "WBTC", 8],
      })

      await deploy("HEGIC", {
        contract: "ERC20Mock",
        from: deployer,
        log: true,
        args: ["HEGIC (Mock)", "HEGIC", 18],
      })
      break
    case "ropsten":
      await deploy("USDC", {
        contract: "ERC20Mock",
        from: deployer,
        log: true,
        args: ["HEGIC Playground USD", "pgUSD", 6],
      })

      await deploy("HEGIC", {
        contract: "ERC20Mock",
        from: deployer,
        log: true,
        args: ["HEGIC Playground", "HEGIC", 18],
      })
      break
    default:
      throw new Error("Unsupported network: " + network.name)
  }
}

deployment.tags = ["test-single", "single-tokens"]
export default deployment
