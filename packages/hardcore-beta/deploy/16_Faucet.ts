import {HardhatRuntimeEnvironment} from "hardhat/types"

const params = {
  forwarder: "0xeB230bF62267E94e657b5cbE74bdcea78EB3a5AB",
  // forwarder: "0x44016948d71fC49308daBB401163236325bF7939",
  relayHub: "0xA703037bCaF8A31a466BD28A260ac646A083361a",
}

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const {deployments, getNamedAccounts} = hre
  const {deploy, get, execute} = deployments
  const {deployer} = await getNamedAccounts()

  if (hre.network.name != "ropsten") return

  const Faucet = await deploy("Faucet", {
    from: deployer,
    log: true,
    args: [(await get("USDC")).address, params.forwarder],
  })

  await deploy("PlaygroundPaymaster", {
    contract: "SingleRecipientPaymaster",
    from: deployer,
    log: true,
    args: [Faucet.address],
  })

  // await execute(
  //   "PlaygroundPaymaster",
  //   {log: true, from: deployer},
  //   "setTrustedForwarder",
  //   params.forwarder,
  // )
  await execute(
    "PlaygroundPaymaster",
    {log: true, from: deployer},
    "setRelayHub",
    params.relayHub,
  )
}

deployment.tags = ["test-single", "Faucet"]
export default deployment
