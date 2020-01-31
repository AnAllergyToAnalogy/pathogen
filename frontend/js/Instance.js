//for testing: provider fallback: https://mainnet.infura.io/v3/2d9d3459d7ef4188a43973a98b27cef7
//for testing: provider fallback: http://127.0.0.1:8545

let web3;
class Instance {
    constructor(provider_fallback){
        //addresses: {Main}
        this.provider_fallback = provider_fallback;
        this.addresses = {
            Main: "0x5E2A5f9e91FE7c1a28A6d33cbF63eA52b4B4618c",
        }


        this.compiled = compiled_contract;

        this.injected = false;
        this.refresh_assignment();
    }

    refresh_assignment(){
        this.assign_provider();
        this.assign_instances();
    }

    assign_instances(){
        const contract_names = {
            Main:   "Pathogen721",
        };

        const instances = {
            Main:   null,
        };

        for(let contract in instances ){
            // const abi = this.compiled["GreyMatter_full"][contract_names[contract]].abi;
            const abi = this.compiled[contract_names[contract]].abi;
            if(web3.eth.contract){
                instances[contract] = web3.eth.contract(
                    abi,
                    this.addresses[contract]
                );
            }else{
                instances[contract] = new web3.eth.Contract(
                    abi,
                    this.addresses[contract]
                );
            }

        }

        this.main   = instances.Main;
    }

    get Main(){
        return this.main;
    }
    assign_provider(){
        console.log('assign provider');
        let provider;
        if(window.ethereum) {
            console.log('window.ethereum');
            provider = window.ethereum;
            this.injected = true;
        }else if(window.web3 && window.web3.currentProvider){
            console.log('window.web3');
            provider = window.web3.currentProvider;
            this.injected = true;
        }else{
            console.log('infura');
            //infura
            provider = new Web3.providers.HttpProvider(this.provider_fallback);
            this.injected = false;
        }
        web3 = new Web3(provider);
    }

    async get_networkId(){
        return await web3.eth.net.getId();
    }

}