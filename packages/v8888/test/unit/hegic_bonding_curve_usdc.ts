import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {Erc20Mock as ERC20} from "../../typechain/Erc20Mock"
import {EthBondingCurve} from "../../typechain/EthBondingCurve"
import {Erc20BondingCurve} from "../../typechain/Erc20BondingCurve"

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
  const provider = new ethers.providers.JsonRpcProvider(url)

  beforeEach(async () => {
    await deployments.fixture("HBC")
    ;[deployer, alice] = await ethers.getSigners()

    USDC = (await ethers.getContract("USDC")) as ERC20
    HEGIC = (await ethers.getContract("HEGIC")) as ERC20
    EthBondingCurve = (await ethers.getContract(
      "USDCBondingCurve",
    )) as EthBondingCurve

    USDCBondingCurve = (await ethers.getContract(
      "USDCBondingCurve",
    )) as Erc20BondingCurve

    await EthBondingCurve.connect(deployer).setHDF(
      "0x3388Ca463C28C26C161E9C131C8be1faC27E997b",
    )

    await USDC.mint(
      await alice.getAddress(),
      ethers.utils.parseUnits("100000000000000000000", await USDC.decimals()),
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

  describe("USDC Bonding Curve", () => {
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
                6,
              )} | ${ethers.utils.formatUnits(dPrice, 6)}`,
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
      let startBalanceAlice = await USDC.balanceOf(await alice.getAddress())
      let startBalanceBC = await HEGIC.balanceOf(USDCBondingCurve.address)
      let amountTokens = 100000
      let amountBuy = ethers.utils.formatUnits(
        await USDCBondingCurve.s(
          await USDCBondingCurve.soldAmount(),
          ethers.utils.parseUnits(`${amountTokens}`),
        ),
      )
      let Tx = await USDCBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits(`${amountTokens}`),
      )
      let Txn_Inf = await ethers.provider.getTransactionReceipt(Tx.hash)
      expect(amountBuy).to.be.eq(
        ethers.utils.formatUnits(
          startBalanceAlice
            .sub(await USDC.balanceOf(await alice.getAddress()))
            .toString(),
        ),
      )
      expect(ethers.utils.formatUnits(startBalanceBC.toString())).to.be.eq(
        ethers.utils.formatUnits(
          (await HEGIC.balanceOf(USDCBondingCurve.address))
            .add(
              startBalanceBC.sub(
                await HEGIC.balanceOf(USDCBondingCurve.address),
              ),
            )
            .toString(),
        ),
      )
      expect(
        ethers.utils.formatUnits(
          (await USDC.balanceOf(USDCBondingCurve.address)).toString(),
        ),
      ).to.be.eq(
        ethers.utils.formatUnits(
          startBalanceAlice
            .sub(await USDC.balanceOf(await alice.getAddress()))
            .toString(),
        ),
      )

      let startBalanceAlice1 = await USDC.balanceOf(await alice.getAddress())
      let amountBuy1 = ethers.utils.formatUnits(
        await USDCBondingCurve.s(
          await USDCBondingCurve.soldAmount(),
          (
            await USDCBondingCurve.soldAmount()
          ).add(ethers.utils.parseUnits(`${amountTokens}`)),
        ),
      )

      let Tx1 = await USDCBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits(`${amountTokens}`),
      )
      let Txn_Inf1 = await ethers.provider.getTransactionReceipt(Tx1.hash)
      expect(amountBuy1).to.be.eq(
        ethers.utils.formatUnits(
          startBalanceAlice1
            .sub(await USDC.balanceOf(await alice.getAddress()))
            .toString(),
        ),
      )
    })

    it("Sell HEGIC", async () => {
      let startBalanceBCBeforeBuy = await HEGIC.balanceOf(
        USDCBondingCurve.address,
      )
      let amountTokens = 100000
      await USDCBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits(`${amountTokens}`),
      )
      let startBalanceAlice = await USDC.balanceOf(await alice.getAddress())
      let startBalanceBC = await HEGIC.balanceOf(USDCBondingCurve.address)
      let startBalanceBCEth = await ethers.provider.getBalance(
        USDCBondingCurve.address,
      )
      let prc10 = ethers.utils.formatUnits(
        (
          await USDCBondingCurve.s(
            (
              await USDCBondingCurve.soldAmount()
            ).sub(BN.from(ethers.utils.parseUnits(`${amountTokens}`))),
            await USDCBondingCurve.soldAmount(),
          )
        )
          .mul(BN.from(20))
          .div(BN.from(100)),
        await USDC.decimals(),
      )
      let prc90 = ethers.utils.formatUnits(
        (
          await USDCBondingCurve.s(
            (
              await USDCBondingCurve.soldAmount()
            ).sub(BN.from(ethers.utils.parseUnits(`${amountTokens}`))),
            await USDCBondingCurve.soldAmount(),
          )
        ).sub(
          (
            await USDCBondingCurve.s(
              (
                await USDCBondingCurve.soldAmount()
              ).sub(BN.from(ethers.utils.parseUnits(`${amountTokens}`))),
              await USDCBondingCurve.soldAmount(),
            )
          )
            .mul(BN.from(20))
            .div(BN.from(100)),
        ),
        // .mul(BN.from(90))
        // .div(BN.from(100)),
        await USDC.decimals(),
      )

      let Tx = await USDCBondingCurve.connect(alice).sell(
        ethers.utils.parseUnits(`${amountTokens}`),
      )
      expect(
        ethers.utils.formatUnits(
          (
            await USDC.balanceOf(await USDCBondingCurve.hegicDevelopmentFund())
          ).toString(),
          await USDC.decimals(),
        ),
      ).to.be.eq(prc10)

      expect(
        ethers.utils.formatUnits(
          (await USDC.balanceOf(await alice.getAddress()))
            .sub(startBalanceAlice)
            .toString(),
          await USDC.decimals(),
        ),
      ).to.be.eq(prc90)

      expect(startBalanceBCBeforeBuy).to.be.eq(
        await HEGIC.balanceOf(USDCBondingCurve.address),
      )
    })

    it("Hegic Amount need higher then 0", async () => {
      await USDCBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits("100000"),
      )
      await expect(
        USDCBondingCurve.connect(alice).sell(ethers.utils.parseUnits("0")),
      ).to.be.revertedWith("Hegic Amount need higher then 0")
    })

    it("You don't have enough funds", async () => {
      await USDCBondingCurve.connect(alice).buy(
        ethers.utils.parseUnits("100000"),
      )
      await expect(
        USDCBondingCurve.connect(alice).sell(ethers.utils.parseUnits("100001")),
      ).to.be.reverted
    })

    it("Buy and Sell HEGIC in one transcation")
  })
})
