import type {BigNumber} from "ethers"
export interface PNLZone {
  left?: {
    profit: boolean
    value: BigNumber
  }
  center?: {
    profit: boolean
    from: BigNumber
    to: BigNumber
  }
  right?: {
    profit: boolean
    value: BigNumber
  }
}
