import Arweave = require('arweave');
import Arlocal from "arlocal"
import {createContract, interactRead, interactWrite} from "smartweave"
import fetch = require("node-fetch")
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
  await mint(address, 9999999999999)
  // Generating a second wallet and putting some Winston into it
  const otherWallet = await arweave.wallets.generate()
  const otherAddress = await arweave.wallets.getAddress(otherWallet)
  await mint(otherAddress, 9999999999999)
  // Sending a transaction so that the second wallet has a last transaction
  let transaction = await arweave.createTransaction({target: address, quantity: "100000"}, otherWallet)
  await arweave.transactions.sign(transaction, wallet)
  await arweave.transactions.post(transaction)
  // Generating a third wallet and putting some Winston into it
  const thirdWallet = await arweave.wallets.generate()
  const thirdAddress = await arweave.wallets.getAddress(thirdWallet)
  // Mining the block in order to save the changes on the chain
  await mine()
  // Converting the contract to a string
  const contractSource = fs.readFileSync("dist/contract.js", "utf-8")
  // The initial state only contains the namespace OpenSea and the connectionTypes follow and superfollow
  const initialState = {
    namespaces: ["OpenSea"],
    connectionTypes: ["follow", "superfollow"],
    connections: {}
  }
  // Create the contract
  const contract = await createContract(arweave, wallet, contractSource, JSON.stringify(initialState))
  // This interaction will go through
  await interactWrite(arweave, wallet, contract, {
    "function": "connect",
    "target": otherAddress,
    "namespace": "OpenSea",
    "connectionType": "follow",
  })
  // This interaction will go through because it's a different connection type
  await interactWrite(arweave, wallet, contract, {
    "function": "connect",
    "target": otherAddress,
    "namespace": "OpenSea",
    "connectionType": "superfollow",
  })
  // This interaction will fail because the third wallet has not had any transactions
  await interactWrite(arweave, otherWallet, contract, {
    "function": "connect",
    "target": thirdAddress,
    "namespace": "OpenSea",
    "connectionType": "follow",
  })
  // Mining the block in order to save the changes on the chain
  await mine()
  // Print the output of interactively reading ("lookup") the state, returns all connections keyed their owners
  console.log(await interactRead(arweave, wallet, contract, {"function": "lookup"}))
  await arlocal.stop()
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