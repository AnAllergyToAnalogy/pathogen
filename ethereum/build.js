const filenames = [
    "Pathogen721"
];
const contracts = [
    "Pathogen721",
    "ValidReceiver",
    "InvalidReceiver"
];

const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");

const buildPath = path.resolve(__dirname,'build');
fs.removeSync(buildPath);

let thisFilename;
let thisPath, thisSource;
let input = {
    language: 'Solidity',
    sources:{},
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
};
for(let i = 0; i < filenames.length; i++){
    thisFilename = filenames[i]+'.sol';
    thisPath = path.resolve(__dirname, 'contracts', thisFilename);
    thisSource = fs.readFileSync(thisPath, 'utf8');

    input.sources[thisFilename] = {
        content: thisSource
    };
};

fs.ensureDirSync(buildPath);

let output;
let compile;
compile = JSON.parse(solc.compile(JSON.stringify(input)));

if(compile.errors){
    console.log("== ERRORS ==");
    for(var e = 0; e < compile.errors.length; e++){
        console.log(compile.errors[e]);
    }
}

output = compile.contracts;

let outputFilename;

for (let contract in output){
    console.log(
        contract.substring(0,contract.indexOf('.sol'))
    );
    outputFilename = contract.substring(0,contract.indexOf('.sol'))+'.json';


    fs.outputJsonSync(
        path.resolve(buildPath,outputFilename),
        output[contract]
    );
}
