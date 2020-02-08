const HDWalletProvider = require('truffle-hdwallet-provider');

//its a random seed from a test rpc, don't bother.
const seed = "hedgehog afraid caught planet say audit apology nose unique evidence clarify shrug";
const provider = new HDWalletProvider(
    seed,
    "http://127.0.0.1:8545",
    0,
    3
);

module.exports = provider;

