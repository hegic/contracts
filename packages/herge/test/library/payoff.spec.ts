import {calculatePayoff} from "../../lib/payoff"
import {parseUnits} from "ethers/lib/utils"
import {expect} from "chai"

describe("Check Payoff", () => {
  describe("ETH", () => {
    const strikePoint = parseUnits("1000", 8)
    const strike_add_five_percent = parseUnits("1050", 8)
    const strike_sub_five_percent = parseUnits("950", 8)

    const strike_add_ten_percent = parseUnits("1100", 8)
    const strike_sub_ten_percent = parseUnits("900", 8)

    const strike_add_twenty_percent = parseUnits("1200", 8)
    const strike_sub_twenty_percent = parseUnits("800", 8)

    const amount = parseUnits("5", 18)

    describe("Straddle", () => {
      it("Current Price > Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRADDLE_ETH",
          amount,
          strikePoint,
          strike_add_ten_percent,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
      })

      it("Current Price < Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRADDLE_ETH",
          amount,
          strikePoint,
          strike_sub_ten_percent,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
      })

      it("Current Price = Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRADDLE_ETH",
          amount,
          strikePoint,
          strikePoint,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
      })
    })

    describe("Strap", () => {
      it("Current Price > Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRAP_ETH",
          amount,
          strikePoint,
          strike_add_ten_percent,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("1000", 6))
      })

      it("Current Price < Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRAP_ETH",
          amount,
          strikePoint,
          strike_sub_ten_percent,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
      })

      it("Current Price = Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRAP_ETH",
          amount,
          strikePoint,
          strikePoint,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
      })
    })

    describe("Strip", () => {
      it("Current Price > Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRIP_ETH",
          amount,
          strikePoint,
          strike_add_ten_percent,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
      })

      it("Current Price < Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRIP_ETH",
          amount,
          strikePoint,
          strike_sub_ten_percent,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("1000", 6))
      })

      it("Current Price = Strike Price", async () => {
        const _calculatePayoff = calculatePayoff(
          "HegicStrategy_STRIP_ETH",
          amount,
          strikePoint,
          strikePoint,
        )
        expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
      })
    })

    describe("Strangle 10%", () => {
      describe("Should return payoff > 0", () => {
        it("Current Price > Strike Price [Call Leg]", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_STRANGLE_10_ETH",
            amount,
            strikePoint,
            strike_add_twenty_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
        })

        it("Current Price < Strike Price [Put Leg]", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_STRANGLE_10_ETH",
            amount,
            strikePoint,
            strike_sub_twenty_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
        })
      })
      describe("Should return payoff = 0", () => {
        it("Current Price = Strike Price [CALL Leg]", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_STRANGLE_10_ETH",
            amount,
            strikePoint,
            strike_add_ten_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })

        it("Current Price = Strike Price [PUT Leg]", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_STRANGLE_10_ETH",
            amount,
            strikePoint,
            strike_sub_ten_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })

        it("Current Price < Strike Price [PUT Leg]", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_STRANGLE_10_ETH",
            amount,
            strikePoint,
            parseUnits("950", 8),
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })

        it("Current Price > Strike Price [CALL Leg]", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_STRANGLE_10_ETH",
            amount,
            strikePoint,
            parseUnits("1050", 8),
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })
      })
    })

    describe("Bull Call Spread 10%", () => {
      describe("Should return payoff > 0", () => {
        it("Current Price > Strike Price", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_CALL_10_ETH",
            amount,
            strikePoint,
            strike_add_twenty_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
        })

        it("Current Price > Strike Price and Current Price < Otm Call Strike", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_CALL_10_ETH",
            amount,
            strikePoint,
            strike_add_five_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("250", 6))
        })
      })

      describe("Should return payoff = 0", () => {
        it("Current Price < Atm Call Strike", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_CALL_10_ETH",
            amount,
            strikePoint,
            strike_sub_ten_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })

        it("Current Price = Atm Call Strike", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_CALL_10_ETH",
            amount,
            strikePoint,
            strikePoint,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })
      })
    })

    describe("Bear Put Spread 10%", () => {
      describe("Should return payoff > 0", () => {
        it("Current Price < Otm Strike Price", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_PUT_10_ETH",
            amount,
            strikePoint,
            strike_sub_twenty_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("500", 6))
        })

        it("Current Price < Strike Price and Current Price > Otm Call Strike", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_PUT_10_ETH",
            amount,
            strikePoint,
            strike_sub_five_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("250", 6))
        })
      })

      describe("Should return payoff = 0", () => {
        it("Current Price > Atm Call Strike", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_PUT_10_ETH",
            amount,
            strikePoint,
            strike_add_five_percent,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })

        it("Current Price = Atm Call Strike", async () => {
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_SPREAD_PUT_10_ETH",
            amount,
            strikePoint,
            strikePoint,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
        })
      })
    })

    describe("Long Butterfly 10%", () => {
      const amount = parseUnits("2", 18)
      const strikePoint = parseUnits("1412.1232", 8)

      describe("Should return payoff > 0", () => {
        it("Current Price = Atm Strike [1]", async () => {
          const exercisePrice = parseUnits("1412.1232", 8)
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
            amount,
            strikePoint,
            exercisePrice,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("282.42464", 6))
        })

        describe("Call Leg", () => {
          it("Current Price < Otm strike and Current Price > Atm Strike [2]", async () => {
            const exercisePrice = parseUnits("1482.72936", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("141.21232", 6))
          })
        })

        describe("Put Leg", () => {
          it("Current Price > Otm strike and Current Price < Atm Strike [5]", async () => {
            const exercisePrice = parseUnits("1350", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("158.17824", 6))
          })
        })
      })

      describe("Should return payoff = 0", () => {
        describe("Call Leg", () => {
          it("Current Price = Sell Otm Call [3]", async () => {
            const exercisePrice = parseUnits("1553.33552", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })

          it("Current Price > Sell Otm Call [4]", async () => {
            const exercisePrice = parseUnits("2000", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })
        })

        describe("Put Leg", () => {
          it("Current Price = Sell Otm Put [6]", async () => {
            const exercisePrice = parseUnits("1270.91088", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })

          it("Current Price < Sell Otm Put [7]", async () => {
            const exercisePrice = parseUnits("10", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_BUTTERFLY_10_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })
        })
      })
    })

    describe("Long Condor 20%", () => {
      const amount = parseUnits("2", 18)
      const strikePoint = parseUnits("1412.1232", 8)

      describe("Should return payoff > 0", () => {
        it("Current Price = Strike Point [1]", async () => {
          const exercisePrice = parseUnits("1412.1232", 8)
          const _calculatePayoff = calculatePayoff(
            "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
            amount,
            strikePoint,
            exercisePrice,
          )
          expect(_calculatePayoff).to.be.eq(parseUnits("282.42464", 6))
        })

        describe("Call Leg", () => {
          it("Current Price < Sell OTM Call Strike [6]", async () => {
            const exercisePrice = parseUnits("1450", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("282.42464", 6))
          })

          it("Current Price = Sell OTM Call Strike [2]", async () => {
            const exercisePrice = parseUnits("1553.33552", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("282.42464", 6))
          })

          it("Current Price > Sell OTM Call Strike and Current Price < Buy OTM Call Strike [8]", async () => {
            const exercisePrice = parseUnits("1600", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("189.095680", 6))
          })
        })

        describe("Put Leg", () => {
          it("Current Price > Sell OTM Put Strike [7]", async () => {
            const exercisePrice = parseUnits("1350", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("282.42464", 6))
          })

          it("Current Price = Sell OTM Put Strike [4]", async () => {
            const exercisePrice = parseUnits("1270.91088", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("282.42464", 6))
          })

          it("Current Price < Sell OTM Put Strike and Current Price > Buy OTM Put Strike [9]", async () => {
            const exercisePrice = parseUnits("1200", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("140.602880", 6))
          })
        })
      })

      describe("Should return payoff = 0", () => {
        describe("Call Leg", () => {
          it("Current Price = Buy Otm Call Strike [3]", async () => {
            const exercisePrice = parseUnits("1694.54784", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })

          it("Current Price > Buy Otm Call Strike [10]", async () => {
            const exercisePrice = parseUnits("5000", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })
        })

        describe("Put Leg", () => {
          it("Current Price = Buy OTM Put Strike [5]", async () => {
            const exercisePrice = parseUnits("1129.69856", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })

          it("Current Price < Buy OTM Put Strike [11]", async () => {
            const exercisePrice = parseUnits("10", 8)
            const _calculatePayoff = calculatePayoff(
              "HegicStrategy_INVERSE_LONG_CONDOR_20_ETH",
              amount,
              strikePoint,
              exercisePrice,
            )
            expect(_calculatePayoff).to.be.eq(parseUnits("0", 6))
          })
        })
      })
    })
  })
})
