import {HardhatRuntimeEnvironment} from "hardhat/types"
import {UniswapV2Pair} from "../typechain/UniswapV2Pair"
import {WethMock} from "../typechain/WethMock"
import {Erc20Mock} from "../typechain/Erc20Mock"

import {bytecode as UniswapV2FactoryBytecode} from "@uniswap/v2-core/build/UniswapV2Factory.json"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts, ethers, network} = hre
  const {deploy, save, getArtifact} = deployments
  const {deployer} = await getNamedAccounts()

  if (network.name == "ropsten" || network.name == "mainnet") {
    console.log(
      "UniswapRouter: ropsten(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D)",
    )
    await save("UniswapRouter", {
      address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      abi: (await getArtifact("UniswapV2Router01")).abi,
    })
  } else {
    const WETH = (await ethers.getContract("WETH")) as WethMock
    const WBTC = (await ethers.getContract("WBTC")) as Erc20Mock
    const USDC = (await ethers.getContract("USDC")) as Erc20Mock
    const tokens = [WETH.address, WBTC.address, USDC.address]

    const amounts = {
      [WBTC.address]: {
        [WETH.address]: [
          ethers.utils.parseUnits("100", 8),
          ethers.utils.parseUnits("2000", 18),
        ],
      },
      [USDC.address]: {
        [WETH.address]: [
          ethers.utils.parseUnits("2500000", 6),
          ethers.utils.parseUnits("1000", 18),
        ],
        [WBTC.address]: [
          ethers.utils.parseUnits("5000000", 6),
          ethers.utils.parseUnits("100", 8),
        ],
      },
    }

    const UniswapV2Library = await ethers.getContractFactory(
      [
        "constructor(address _feeToSetter)",
        "function createPair(address tokenA, address tokenB) external returns (address pair)",
        "function getPair(address tokenA, address tokenB) external view returns (address pair)",
      ],
      UniswapV2FactoryBytecode,
    )

    const uniswapV2Library = await UniswapV2Library.deploy(deployer)

    await deploy("UniswapRouter", {
      contract: "UniswapV2Router01",
      from: deployer,
      log: true,
      args: [uniswapV2Library.address, WETH.address],
    })

    await WETH.deposit({value: ethers.utils.parseUnits("3000")})
    await WBTC.mint(deployer, ethers.utils.parseUnits("200", 8))
    await USDC.mint(deployer, ethers.utils.parseUnits("10000000", 6))

    for (let i = 0; i < tokens.length; i++)
      for (let j = 0; j < i; j++) {
        await uniswapV2Library.createPair(tokens[i], tokens[j])
        const p = await uniswapV2Library.getPair(tokens[i], tokens[j])
        const pp = (await ethers.getContractAt(
          "UniswapV2Pair",
          p,
        )) as UniswapV2Pair
        await ethers
          .getContractAt("ERC20", tokens[i])
          .then((instance) =>
            instance.transfer(p, amounts[tokens[i]][tokens[j]][0]),
          )
        await ethers
          .getContractAt("ERC20", tokens[j])
          .then((instance) =>
            instance.transfer(p, amounts[tokens[i]][tokens[j]][1]),
          )
        await pp.mint(deployer)
      }
  }
}

deployment.tags = ["test", "uni"]
export default deployment
