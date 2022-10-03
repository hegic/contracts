import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {EthBondingCurve} from "../../typechain/EthBondingCurve"
import {Erc20BondingCurve} from "../../typechain/Erc20BondingCurve"
import {BuySell} from "../../typechain/BuySell"

chai.use(solidity)
const {expect} = chai

describe("HegicBoundigCurve", async () => {
  let USDC: ERC20
  let HEGIC: ERC20
  let deployer: Signer
  let alice: Signer
  let EthBondingCurve: EthBondingCurve
  let USDCBondingCurve: Erc20BondingCurve
  const url = "http://localhost:8545"

  beforeEach(async () => {
    await deployments.fixture("HBC")
    ;[deployer, alice] = await ethers.getSigners()

    USDC = (await ethers.getContract("USDC")) as ERC20
    HEGIC = (await ethers.getContract("HEGIC")) as ERC20
    EthBondingCurve = (await ethers.getContract(
      "ETHBondingCurve",
    )) as EthBondingCurve

    USDCBondingCurve = (await ethers.getContract(
      "USDCBondingCurve",
    )) as Erc20BondingCurve

    await EthBondingCurve.connect(deployer).setHDF(
      "0x3388Ca463C28C26C161E9C131C8be1faC27E997b",
    )

    await USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("1000000000000000", await USDC.decimals()),
    )

    await USDC.connect(alice).approve(
      USDCBondingCurve.address,
      ethers.constants.MaxUint256,
    )

    await HEGIC.connect(alice).approve(
      EthBondingCurve.address,
      ethers.constants.MaxUint256,
    )

    await HEGIC.connect(alice).approve(
      USDCBondingCurve.address,
      ethers.constants.MaxUint256,
    )

    await HEGIC.mint(
      EthBondingCurve.address,
      ethers.utils.parseUnits("100000000", await HEGIC.decimals()),
    )

    await HEGIC.mint(
      USDCBondingCurve.address,
      ethers.utils.parseUnits("100000000", await HEGIC.decimals()),
    )
  })

  describe("ETH Bonding Curve", () => {
    if (process.env.DEV)
      it("StartPrice/StartCoff", async () => {
        async function priceFor(_amount: string) {
          const amount = ethers.utils.parseUnits(_amount)
          const price = await EthBondingCurve.s(0, amount)
          const dPrice = price.mul("1000000000000000000").div(amount)

          console.log(
            "\t" +
              `${_amount}: ${ethers.utils.formatUnits(
                price,
                18,
              )} | ${ethers.utils.formatUnits(dPrice, 18)}`,
          )
        }
        await priceFor("1")
        await priceFor("1000")
        await priceFor("10000")
        await priceFor("100000")
        await priceFor("888000")
        await priceFor("8880000")
      })
    it("Buy HEGIC", async () => {
      let startBalanceAlice = await alice.getBalance()
      let startBalanceBC = await HEGIC.balanceOf(EthBondingCurve.address)
      let amountTokens = 100000
      let amountBuy = ethers.utils.formatUnits(
        await EthBondingCurve.s(
          await EthBondingCurve.soldAmount(),
          ethers.utils.parseUnits(`${amountTokens}`),
        ),
      )
      let Tx = await EthBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits(`${amountTokens}`),
        {
          value: ethers.utils.parseUnits("51"),
        },
      )
      let Txn_Inf = await ethers.provider.getTransactionReceipt(Tx.hash)
      expect(amountBuy).to.be.eq(
        ethers.utils.formatUnits(
          startBalanceAlice
            .sub(await alice.getBalance())
            .sub(Txn_Inf.gasUsed.mul(Tx.gasPrice || 0))
            .toString(),
        ),
      )
      expect(ethers.utils.formatUnits(startBalanceBC.toString())).to.be.eq(
        ethers.utils.formatUnits(
          (await HEGIC.balanceOf(EthBondingCurve.address))
            .add(
              startBalanceBC.sub(
                await HEGIC.balanceOf(EthBondingCurve.address),
              ),
            )
            .toString(),
        ),
      )
      expect(
        ethers.utils.formatUnits(
          (
            await ethers.provider.getBalance(EthBondingCurve.address)
          ).toString(),
        ),
      ).to.be.eq(
        ethers.utils.formatUnits(
          startBalanceAlice
            .sub(await alice.getBalance())
            .sub(Txn_Inf.gasUsed.mul(Tx.gasPrice || 0))
            .toString(),
        ),
      )
      let startBalanceAlice1 = await alice.getBalance()
      let amountBuy1 = ethers.utils.formatUnits(
        await EthBondingCurve.s(
          await EthBondingCurve.soldAmount(),
          (
            await EthBondingCurve.soldAmount()
          ).add(ethers.utils.parseUnits(`${amountTokens}`)),
        ),
      )
      let Tx1 = await EthBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits(`${amountTokens}`),
        {
          value: ethers.utils.parseUnits("51"),
        },
      )
      let Txn_Inf1 = await ethers.provider.getTransactionReceipt(Tx1.hash)
      expect(amountBuy1).to.be.eq(
        ethers.utils.formatUnits(
          startBalanceAlice1
            .sub(await alice.getBalance())
            .sub(Txn_Inf1.gasUsed.mul(Tx1.gasPrice || 0))
            .toString(),
        ),
      )
    })

    it("Sell HEGIC", async () => {
      let startBalanceBCBeforeBuy = await HEGIC.balanceOf(
        EthBondingCurve.address,
      )
      let amountTokens = 100000
      await EthBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits(`${amountTokens}`),
        {
          value: ethers.utils.parseUnits("51"),
        },
      )
      let startBalanceAlice = await alice.getBalance()
      let startBalanceBC = await HEGIC.balanceOf(EthBondingCurve.address)
      let startBalanceBCEth = await ethers.provider.getBalance(
        EthBondingCurve.address,
      )
      let prc10 = ethers.utils.formatUnits(
        (
          await EthBondingCurve.s(
            (
              await EthBondingCurve.soldAmount()
            ).sub(BN.from(ethers.utils.parseUnits(`${amountTokens}`))),
            await EthBondingCurve.soldAmount(),
          )
        )
          .mul(BN.from(20))
          .div(BN.from(100)),
      )
      let prc90 = ethers.utils.formatUnits(
        (
          await EthBondingCurve.s(
            (
              await EthBondingCurve.soldAmount()
            ).sub(BN.from(ethers.utils.parseUnits(`${amountTokens}`))),
            await EthBondingCurve.soldAmount(),
          )
        ).sub(
          (
            await EthBondingCurve.s(
              (
                await EthBondingCurve.soldAmount()
              ).sub(BN.from(ethers.utils.parseUnits(`${amountTokens}`))),
              await EthBondingCurve.soldAmount(),
            )
          )
            .mul(BN.from(20))
            .div(BN.from(100)),
        ),
        // .mul(BN.from(90))
        // .div(BN.from(100)),
      )
      let Tx = await EthBondingCurve.connect(alice).sell(
        ethers.utils.parseUnits(`${amountTokens}`),
      )
      let Txn_Inf = await ethers.provider.getTransactionReceipt(Tx.hash)
      expect(
        ethers.utils.formatUnits(
          (
            await ethers.provider.getBalance(
              await EthBondingCurve.hegicDevelopmentFund(),
            )
          ).toString(),
        ),
      ).to.be.eq(prc10)

      expect(
        ethers.utils.formatUnits(
          (await alice.getBalance())
            .sub(startBalanceAlice)
            .add(Txn_Inf.gasUsed.mul(Tx.gasPrice || 0))
            .toString(),
        ),
      ).to.be.eq(prc90)

      expect(startBalanceBCBeforeBuy).to.be.eq(
        await HEGIC.balanceOf(EthBondingCurve.address),
      )
    })

    it("You don't have enough ETH", async () => {
      await expect(
        EthBondingCurve.connect(alice).buy(ethers.utils.parseUnits("100000"), {
          value: ethers.utils.parseUnits("1"),
        }),
      ).to.be.revertedWith("Value is too small")
    })

    it("Value is too small = 0", async () => {
      await expect(
        EthBondingCurve.connect(alice).buy(ethers.utils.parseUnits("100000"), {
          value: ethers.utils.parseUnits("0"),
        }),
      ).to.be.revertedWith("Value is too small")
    })

    it("Hegic Amount need higher then 0", async () => {
      await EthBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits("100000"),
        {
          value: ethers.utils.parseUnits("10"),
        },
      )
      await expect(
        EthBondingCurve.connect(alice).sell(ethers.utils.parseUnits("0")),
      ).to.be.revertedWith("Hegic Amount need higher then 0")
    })

    it("You don't have enough funds", async () => {
      await EthBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits("100000"),
        {
          value: ethers.utils.parseUnits("10"),
        },
      )
      await expect(
        EthBondingCurve.connect(alice).sell(ethers.utils.parseUnits("100001")),
      ).to.be.reverted
    })

    it("Buy and Sell HEGIC in one transcation")
  })
})
