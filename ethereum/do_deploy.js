//Silence Console logs
let Console = {
    // log: ()=>{}
    log: console.log
}

const Web3 = require('web3');

const provider = require("./provider.js");

const web3 = new Web3(provider);
const path = require('path');
const fs = require('fs').promises;


const files = [
    "Pathogen721",
];
const contracts = [
    "Pathogen721",
    "ValidReceiver",
    "InvalidReceiver"
];

let compiled = {}, file;

for(let i = 0; i < files.length; i++) {
    file = files[i];
    compiled[file] = require('./build/'+file+'.json');
}

const deploy = async () => {
    let addresses = {};
    let contracts_deployed = {};

    Console.log('Get accounts...');
    const accounts = await web3.eth.getAccounts();
    Console.log("  Account 0:", accounts[0]);

    let toDeploy, deployed, gasEstimate;

    for(let file in compiled){
        for(let c = 0; c < contracts.length; c++) {
            const contract = contracts[c];
            Console.log(contract);
            const abi = compiled[file][contract].abi;

            const bytecode = "0x" + compiled[file][contract].evm.bytecode.object;

            try {
                Console.log('  preparing...');
                toDeploy = await new web3.eth.Contract(abi).deploy({
                    data: bytecode,
                    // arguments: get_arguments(contract)
                });
            } catch (e) {
                Console.log('--ERROR--');
                Console.log(e);
            }

            try {
                Console.log('  estimating gas...');
                gasEstimate = await toDeploy.estimateGas();
                Console.log('Gas estimate:', gasEstimate);
            } catch (e) {
                Console.log('--ERROR--');
                Console.log(e);
            }

            try {
                Console.log('  deploying...');
                deployed = await toDeploy.send({gas: gasEstimate, from: accounts[0]});
            } catch (e) {
                Console.log('--ERROR--');
                Console.log(e);
                process.exit(0);
            }

            Console.log('  Deployed to', deployed.options.address);
            addresses[contract] = deployed.options.address;
            contracts_deployed[contract] = deployed;
        }
    }
    return contracts_deployed;
}

const linkContracts = async (contracts) => {
    const accounts = await web3.eth.getAccounts();

    let toSend, gasEstimate;
    Console.log("Main contract -> link to 721");
    try{
        Console.log('  preparing...');
        toSend = contracts.GreyMatter.methods.set_token(
            contracts.GreyMatter721.options.address
        );
        Console.log('  estimating gas...');
        gasEstimate = await toSend.estimateGas();
        Console.log('Gas estimate:',gasEstimate);

        Console.log(' sending...');
        await toSend.send({gas: gasEstimate, from: accounts[0]});
        Console.log('    Done.');
    }catch(e){
        Console.log('    Failed:');
        Console.log(e);
        process.exit();
    }

}

const deployAndLinkContracts = async() => {
    Console.log('Deploy contracts...');
    const contracts = await deploy();
    Console.log('Deployment complete');

    // Console.log("Contracts:");
    // for(let c in contracts["GreyMatter"]){
    //     Console.log(c);
    // }
    // process.exit(0);

    // Console.log('Link contracts...');
    // await linkContracts(contracts);
    // Console.log('Link complete');




    Console.log('Addresses:');
    let address_string = "module.exports = { \r\n";
    for(let contract in contracts){
        address_string += "\t"+contract+':\''+contracts[contract].options.address+'\', \r\n';
        Console.log(contract+':',contracts[contract].options.address);
    }
    address_string += "};";

    Console.log('Writing contract addresses to file...');
    let filename = await path.resolve(__dirname,"addresses.js");
    Console.log("Write to",filename);
    try{
        await fs.writeFile(filename, address_string);
    }catch(e){
        console.log(e);
        process.exit(0);
    }
    Console.log("  done.");


    return contracts;
}

// deployAndLinkContracts();



module.exports = {
    deploy: deploy,
    linkContracts: linkContracts,
    deployAndLinkContracts: deployAndLinkContracts,
};