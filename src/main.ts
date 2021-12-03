import Arweave = require('arweave');
import Arlocal from "arlocal"
import {createContract, readContract, interactRead, interactWrite, smartweave} from "smartweave"
import fetch = require("node-fetch")
import * as fs from "fs"

async function contract() {
  // Generating a wallet and putting some Winston into it
  const wallet = await arweave.wallets.generate();
  const address = await arweave.wallets.getAddress(wallet)
  fs.writeFileSync("wallet.json", JSON.stringify(wallet))
  await mint(address, 9999999999999)
  await mine()
  // Converting the contract to a string
  const contractSource = fs.readFileSync("dist/contract.js", "utf-8")
  // The initial state only contains the namespace OpenSea and the connectionTypes follow and superfollow
  const initialState = {
    owners: [address],
    namespaces: {OpenSea: ["follow", "superfollow"], mastodon: ["follow", "superfollow"]},
    connections: {}
  }
  // Create the contract
  fs.writeFileSync("contract.txt", await createContract(arweave, wallet, contractSource, JSON.stringify(initialState)))
}
  
async function mint(address:string, amount: Number) {
  // Minting a given amount of Winston to the given address
  await fetch(`http://localhost:1984/mint/${address}/${amount}`)
}

async function followRandom() {
  const newWallet = await arweave.wallets.generate()
  fs.writeFileSync("newWallet.json", JSON.stringify(newWallet))
  await mint(await arweave.wallets.getAddress(newWallet), 99999999999)
  await mine()
  //const newWallet = JSON.parse(fs.readFileSync("newWallet.json", "utf-8"))
  await smartweave.interactWrite(arweave, newWallet, contractId, {function: "follow", target: address, namespace: "mastodon", connectionType: "superfollow"})
  await mine()
}

async function unfollowRandom(){
  const newWallet = JSON.parse(fs.readFileSync("newWallet.json", "utf-8"))
  await smartweave.interactWrite(arweave, newWallet, contractId, {function: "unfollow", target: address, namespace: "mastodon", connectionType: "superfollow"})
  await mine()
}

async function read() {
  await mine()
  console.log(await smartweave.readContract(arweave, contractId))
}

async function mine() {
  // Mining a new block
  await fetch("http://localhost:1984/mine")
}

// Initializing arweave
const arweave = Arweave.init({
  host: 'localhost',
  port: 1984,
  protocol: 'http',
  timeout: 20000,
  logging: true,
});

const contractId = fs.readFileSync("contract.txt", "utf-8")
const wallet = JSON.parse(fs.readFileSync("wallet.json", "utf-8"))
let address: string

async function addAddr(){
  address = await arweave.wallets.getAddress(wallet)
}

async function main(){
  await addAddr()
  await followRandom()
  console.log(await readContract(arweave, contractId))
  console.log(await interactRead(arweave, wallet, contractId, {function: "followings"}))
  //await unfollowRandom()
  //console.log(await readContract(arweave, contractId))
  //console.log(await interactRead(arweave, wallet, contractId, {function: "followings"}))
}
main()