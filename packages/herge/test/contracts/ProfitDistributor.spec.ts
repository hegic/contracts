import {expect} from "chai"
import {fixture, Fixture} from "../utils/fixtures"
import {parseUnits} from "ethers/lib/utils"

describe("CoverPool", () => {
  let testData: Fixture

  beforeEach(async () => {
    const {USDC, ProfitDistributor} = (testData = await fixture())

    await USDC.mint(ProfitDistributor.address, 1e6)
  })

  describe("Profits", () => {
    it("should add new receipents", async () => {
      const {
        ProfitDistributor,
        signers: [, alice, ,],
      } = testData

      await ProfitDistributor.setProfitRecipients([
        {
          account: alice.address,
          share: parseUnits("1", 9),
        },
      ])
      const rec0 = await ProfitDistributor.recipients(0)
      expect(rec0.account).is.eq(alice.address)
      expect(rec0.share).is.eq(parseUnits("1", 9))
      await expect(ProfitDistributor.recipients(1)).to.be.reverted
    })

    it("should set new users", async () => {
      const {
        ProfitDistributor,
        signers: [, alice, bob, carl],
      } = testData

      await ProfitDistributor.setProfitRecipients([
        {
          account: alice.address,
          share: parseUnits("0.333333333", 9),
        },

        {
          account: bob.address,
          share: parseUnits("0.333333333", 9),
        },

        {
          account: carl.address,
          share: parseUnits("0.333333334", 9),
        },
      ])
      const rec0 = await ProfitDistributor.recipients(0)
      const rec1 = await ProfitDistributor.recipients(1)
      const rec2 = await ProfitDistributor.recipients(2)

      expect(rec0.account).is.eq(alice.address)
      expect(rec0.share).is.eq(parseUnits("0.333333333", 9))
      expect(rec1.account).is.eq(bob.address)
      expect(rec1.share).is.eq(parseUnits("0.333333333", 9))
      expect(rec2.account).is.eq(carl.address)
      expect(rec2.share).is.eq(parseUnits("0.333333334", 9))
    })

    it("should revert transcation when Recipients is more than 20", async () => {
      const {
        ProfitDistributor,
        signers: [, alice, ,],
      } = testData

      await expect(
        ProfitDistributor.setProfitRecipients([
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.8", 9),
          },
          {
            account: alice.address,
            share: parseUnits("0.01", 9),
          },
        ]),
      ).to.be.reverted
    })

    it("should set 20 Recipients ", async () => {
      const {
        ProfitDistributor,
        signers: [, alice, ,],
        USDC,
      } = testData

      await ProfitDistributor.setProfitRecipients([
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.01", 9),
        },
        {
          account: alice.address,
          share: parseUnits("0.81", 9),
        },
      ])
      await expect(() =>
        ProfitDistributor.distributeProfit(),
      ).changeTokenBalance(USDC, alice, 1e6)
    })

    it("should distribute profits correct", async () => {
      const {
        ProfitDistributor,
        signers: [, alice, bob, carl],
        USDC,
      } = testData

      await ProfitDistributor.setProfitRecipients([
        {
          account: alice.address,
          share: parseUnits("0.333333333", 9),
        },

        {
          account: bob.address,
          share: parseUnits("0.333333333", 9),
        },

        {
          account: carl.address,
          share: parseUnits("0.333333334", 9),
        },
      ])
      await expect(() =>
        ProfitDistributor.distributeProfit(),
      ).changeTokenBalances(
        USDC,
        [alice, bob, carl],
        [0.333333e6, 0.333333e6, 0.333333e6],
      )
    })

    it("should remove previous recipients and set new", async () => {
      const {
        ProfitDistributor,
        signers: [, alice, bob, carl],
        USDC,
      } = testData

      await ProfitDistributor.setProfitRecipients([
        {
          account: alice.address,
          share: parseUnits("0.333333333", 9),
        },

        {
          account: bob.address,
          share: parseUnits("0.333333333", 9),
        },

        {
          account: carl.address,
          share: parseUnits("0.333333334", 9),
        },
      ])
      await expect(() =>
        ProfitDistributor.distributeProfit(),
      ).changeTokenBalances(
        USDC,
        [alice, bob, carl],
        [0.333333e6, 0.333333e6, 0.333333e6],
      )

      await USDC.mint(ProfitDistributor.address, 100e6)
      await ProfitDistributor.setProfitRecipients([
        {
          account: bob.address,
          share: parseUnits("0.9", 9),
        },

        {
          account: carl.address,
          share: parseUnits("0.1", 9),
        },
      ])
      await expect(() =>
        ProfitDistributor.distributeProfit(),
      ).changeTokenBalances(USDC, [bob, carl], [90e6, 10e6])
    })
  })
})
