const Web3 = require('web3');

const provider = require("./provider.js");

const web3 = new Web3(provider);

const me = "0xAeA13531Ab3726086A02fD9254ee3dC37c876442";


const do_fund = async() => {
    console.log("Funding account",me,"with 1 ether...");
    const accounts = await web3.eth.getAccounts();
    const amount = web3.utils.toWei("1","ether");

    const send = await web3.eth.sendTransaction({from:accounts[0],to:me,value:amount});
    console.log('Done.');
    process.exit(0);
}
do_fund();