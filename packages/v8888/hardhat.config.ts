import { HardhatUserConfig } from "hardhat/types"
// import { task } from "hardhat/config"
// import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan"
import "hardhat-typechain"
import "hardhat-deploy"
import "hardhat-abi-exporter"
import "hardhat-deploy-ethers"
import "hardhat-docgen"
import "hardhat-gas-reporter"
import "hardhat-watcher"
import "hardhat-local-networks-config-plugin"
import "solidity-coverage"
import "@atixlabs/hardhat-time-n-mine"
// import "@atixlabs/hardhat-time-n-mine/dist/src/type-extensions"
import "hardhat-dependency-compiler"

// import { config as dotEnvConfig } from "dotenv"

// dotEnvConfig()

const { ETHERSCAN_API_KEY, COIN_MARKET_CAP } = process.env

const config: HardhatUserConfig = {
  localNetworksConfig: "~/.hardhat/networks.json",
  dependencyCompiler: {
    paths: [
      "@hegic/utils/contracts/Mocks/ERC20Mock.sol",
      "@hegic/utils/contracts/Mocks/WETHMock.sol",
      "@hegic/utils/contracts/Mocks/PriceProviderMock.sol",
      "@uniswap/v2-periphery/contracts/UniswapV2Router01.sol",
      "@uniswap/v2-core/contracts/UniswapV2Pair.sol",
      "@uniswap/v2-core/contracts/UniswapV2Factory.sol",
    ]
  },
  defaultNetwork: "hardhat",
  solidity: {
    compilers: ["0.8.14", "0.8.15", "0.8.6", "0.6.6", "0.5.16"].map(
      (version) => ({
        version,
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }),
    ),
  },
  networks: {
    coverage: {
      url: "http://127.0.0.1:8555",
      gasPrice: 100e9,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  mocha: {
    // reporter: "nyan",
    forbidOnly: !Boolean(process.env.DEV),
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: COIN_MARKET_CAP,
    enabled: process.env.REPORT_GAS ? true : false,
    gasPrice: 1,
  },
  docgen: {
    path: "./docs",
    runOnCompile: Boolean(process.env.DEV),
  },
}

export default config
