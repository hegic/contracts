import {ethers, deployments} from "hardhat"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {Erc20Mock as ERC20} from "../typechain/Erc20Mock"
import {HegicStakeAndCover} from "../typechain/HegicStakeAndCover"
import {HegicStakeAndCoverDistributor} from "../typechain/HegicStakeAndCoverDistributor"
import transferList from "../scripts/PrepareBalances/transfer_list.json"

chai.use(solidity)
const {expect} = chai

const fixture = deployments.createFixture(async ({deployments}) => {
  await deployments.fixture(["HegicStakeAndCoverDistributor"])

  const [deployer, alice, piter] = await ethers.getSigners()

  const totalAmount = transferList
    .map((x) => ethers.BigNumber.from(x.amount))
    .reduce((x, y) => x.add(y))

  return {
    transferList,
    totalAmount,
    deployer,
    alice,
    piter,
    USDC: (await ethers.getContract("USDC")) as ERC20,
    HEGIC: (await ethers.getContract("HEGIC")) as ERC20,
    HegicStakeAndCover: (await ethers.getContract(
      "HegicStakeAndCover",
    )) as HegicStakeAndCover,
    HegicStakeAndCoverDistributor: (await ethers.getContract(
      "HegicStakeAndCoverDistributor",
    )) as HegicStakeAndCoverDistributor,
  }
})

describe("HegicStakeAndCoverDistributor", async () => {
  let contracts: Awaited<ReturnType<typeof fixture>>
  before(async () => {
    contracts = await fixture()
    const {alice, HEGIC} = contracts

    await contracts.USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
    )

    await contracts.USDC.mint(
      contracts.HegicStakeAndCover.address,
      ethers.utils.parseUnits("1000000", await contracts.USDC.decimals()),
    )
    await contracts.HEGIC.mint(
      contracts.HegicStakeAndCover.address,
      contracts.totalAmount,
    )
    await contracts.HegicStakeAndCover.saveFreeTokens()

    await contracts.HegicStakeAndCover.transferShare(
      contracts.HegicStakeAndCoverDistributor.address,
      await contracts.HegicStakeAndCover.balanceOf(
        await contracts.deployer.getAddress(),
      ),
    )
    const tx = await contracts.HegicStakeAndCoverDistributor.distribute(
      contracts.transferList,
    )
  })

  let i = 0

  for (let transfer of transferList)
    it(`Test ${i++}, ${transfer.account} <- ${
      parseFloat(transfer.amount) / 1e18
    }`, async () => {
      expect(
        await contracts.HegicStakeAndCover.balanceOf(transfer.account),
      ).to.be.eq(transfer.amount)
    })

  it("should has no balance on HegicStakeAndCoverDistributor and deployer", async () => {
    expect(
      await contracts.HegicStakeAndCover.balanceOf(
        await contracts.deployer.getAddress(),
      ),
    ).to.be.eq(0)

    expect(
      await contracts.HegicStakeAndCover.balanceOf(
        contracts.HegicStakeAndCoverDistributor.address,
      ),
    ).to.be.eq(0)
  })
})
