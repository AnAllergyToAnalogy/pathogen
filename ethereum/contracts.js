const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const provider = require("./provider.js");
const web3 = new Web3(provider);

const addresses = require("./addresses.js");

const files = [
    "Pathogen721",
];
const contracts = [
    "Pathogen721",
    "ValidReceiver",
    "InvalidReceiver",
];

let compiled = {}, file;
let contracts_deployed = {};


for(let i = 0; i < files.length; i++) {
    file = files[i];
    compiled[file] = require('./build/'+file+'.json');
}

for(let file in compiled) {
    for (let c = 0; c < contracts.length; c++) {
        const contract = contracts[c];
        const abi = compiled[file][contract].abi;
        // const bytecode = "0x" + compiled[file][contract].evm.bytecode.object;

        contracts_deployed[contract] = new web3.eth.Contract(
            abi,
            addresses[contract]
        );
    }
}
module.exports = contracts_deployed;