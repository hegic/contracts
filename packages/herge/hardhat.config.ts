import { HardhatUserConfig } from "hardhat/types"
import { task } from "hardhat/config"
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins"
import "@nomiclabs/hardhat-waffle"
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
import "@atixlabs/hardhat-time-n-mine/dist/src/type-extensions"
import "hardhat-dependency-compiler"
import dotenv from "dotenv"
import { writeFile } from "fs/promises"

dotenv.config()

const { ETHERSCAN_API_KEY, COIN_MARKET_CAP } = process.env

export default {
  dependencyCompiler: {
    paths: [
      "@hegic/utils/contracts/Mocks/ERC20Mock.sol",
      "@hegic/utils/contracts/Mocks/PriceProviderMock.sol",
      "@hegic/v8888/contracts/OptionsManager/OptionsManager.sol",
      "@hegic/v8888/contracts/PriceCalculators/PolynomialPriceCalculator.sol",
      "@hegic/v8888/contracts/PriceCalculators/CombinedPriceCalculator.sol",
    ]
  },
  localNetworksConfig: "~/.hardhat/networks.json",
  defaultNetwork: "hardhat",
  solidity: {
    compilers: ["0.8.15"].map(
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
    payoffPool: {
      default: 9
    }
  },
  mocha: {
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
  abiExporter: {
    clear: true,
    runOnCompile: true
  }
} as HardhatUserConfig

task("addresses", "Print the list of deployed contracts", async (_, hre) => {
  const contracts = await hre.deployments.all()
  const table: { [key: string]: { address: string } } = {}
  for (let contract of Object.keys(contracts)) {
    table[contract] = { address: contracts[contract].address }
  }
  console.table(table)
})

task("deploy").setAction(async (params, hre, runSupper) => {
  await runSupper(params)
  const addresses = await hre.deployments.all()
    .then(Object.entries)
    .then(x => x.map(([name, value]) => [name, value.address as string]))
    .then(Object.fromEntries)
  if (params.write && hre.network.name != HARDHAT_NETWORK_NAME)
    await writeFile(
      `./deployments/${hre.network.name}/.addresses.json`,
      JSON.stringify(addresses)
    )
})
