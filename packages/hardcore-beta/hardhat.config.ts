import {HardhatUserConfig} from "hardhat/types"
import {task} from "hardhat/config"
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

import {config as dotEnvConfig} from "dotenv"

dotEnvConfig()

const {ETHERSCAN_API_KEY, COIN_MARKET_CAP} = process.env

const config: HardhatUserConfig = {
  localNetworksConfig: "~/.hardhat/networks.json",
  dependencyCompiler:{
    paths:[
      "@hegic/utils/contracts/Mocks/ERC20Mock.sol",
      "@hegic/utils/contracts/Mocks/WETHMock.sol",
      "@hegic/utils/contracts/Mocks/PriceProviderMock.sol",
      "@hegic/v8888/contracts/OptionsManager/OptionsManager.sol",
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

task("addresses", "Print the list of deployed contracts", async (_, hre) => {
  const contracts = await hre.deployments.all()
  const table: {[key: string]: {address: string}} = {}
  for (let contract of Object.keys(contracts)) {
    table[contract] = {address: contracts[contract].address}
  }
  console.table(table)
})

task("currentRates", "Print the list of deployed contracts", async (_, hre) => {
  const contracts = await hre.deployments.all()
  const table: {contract: string; value: string}[] = []
  for (let contract of Object.keys(contracts).filter((x) =>
    x.match(/\d*PriceCalculator/),
  )) {
    const c = await hre.ethers.getContract(contract)
    table.push({
      contract,
      value: await c.impliedVolRate().then((x: any) => x.toString()),
    })
  }
  console.table(table)
})

export default config
