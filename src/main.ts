import Arweave = require('arweave');
import Arlocal from "arlocal"
import {createContract, readContract, interactRead, interactWrite} from "smartweave"
import fetch = require("node-fetch")
import { JWKInterface, JWKPublicInterface } from 'arweave/node/lib/wallet';
import * as fs from "fs"

async function main() {
  // Creating a new local testnet
  const arlocal = new Arlocal(1984, false)
  await arlocal.start()
  // Initializing arweave
  const arweave = Arweave.init({
    host: 'localhost',
    port: 1984,
    protocol: 'http',
    timeout: 20000,
    logging: true,
  });
  // Generating a wallet and putting some Winston into it
  const wallet = await arweave.wallets.generate();
  const address = await arweave.wallets.getAddress(wallet)
  await mint(address, 999999999999999)
  // Generating a second wallet and putting some Winston into it
  const otherWallet = await arweave.wallets.generate()
  const otherAddress = await arweave.wallets.getAddress(otherWallet)
  await mint(otherAddress, 999999999999999)
  // Generating a third wallet and putting some Winston into it
  const thirdWallet = await arweave.wallets.generate()
  const thirdAddress = await arweave.wallets.getAddress(thirdWallet)
  await mint(thirdAddress, 999999999999999)
  // Mining the block in order to save the changes on the chain
  await mine()
  // Creating the SmartWeave contract
  const contract = await createMyContract(arweave, wallet);
  // Interacting with the contract in different ways
  await consumeContract(arweave, otherWallet, contract, address)
  await consumeContract(arweave, thirdWallet, contract, address)
  await consumeContract(arweave, thirdWallet, contract, otherAddress)
  // Mining the block in order to save the changes on the chain
  await mine()
  // Print the output of reading the state
  console.log(await readContract(arweave, contract))
  // Print the output of interactively reading ("lookup") the state
  console.log(await interactRead(arweave, wallet, contract, {"function": "lookup"}))
  await arlocal.stop()
}

async function consumeContract(arweave: Arweave, wallet: JWKPublicInterface, contract: string, otherWallet?: string) {
  // Generate a new address
  if (!otherWallet) {
    otherWallet = await arweave.wallets.getAddress(await arweave.wallets.generate())
  }
  // Writing the changes to the chain
  return await interactWrite(arweave, wallet, contract, {
    "function": "connect",
    "target": otherWallet,
    "namespace": "OpenSea",
    "connectionType": "follow",
    })
  }

async function createMyContract(arweave: Arweave, wallet: JWKInterface) {
    // Converting the contract to a string
    const contractSource = fs.readFileSync("dist/contract.js", "utf-8")
    // Creating the on-chain contract and returning the TxId
    return await createContract(arweave, wallet, contractSource, JSON.stringify({}));
  }
  
async function mint(address:string, amount: Number) {
  // Minting a given amount of Winston to the given address
  await fetch(`http://localhost:1984/mint/${address}/${amount}`)
}

async function mine() {
  // Mining a new block
  await fetch("http://localhost:1984/mine")
}

main()