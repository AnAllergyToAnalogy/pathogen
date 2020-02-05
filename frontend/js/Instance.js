//for testing: provider fallback: https://mainnet.infura.io/v3/2d9d3459d7ef4188a43973a98b27cef7
//for testing: provider fallback: http://127.0.0.1:8545

let web3, web3_socket;
class Instance {
    constructor(provider_fallback){
        //addresses: {Main}
        this.provider_fallback = provider_fallback;
        // this.provider_sockets = "wss://mainnet.infura.io/ws";
        this.provider_sockets = "wss://rinkeby.infura.io/ws";
        this.addresses = {
            Main: "0x95944D80D73f2785d6bB645A86F5f59bB65970dD",
        }

        this.compiled = compiled_contract;

        this.injected = false;
        this.provider_type = "unset";

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
        const instances_socket = {
            Main: null,
        };

        for(let contract in instances ){
            // const abi = this.compiled["GreyMatter_full"][contract_names[contract]].abi;
            const abi = this.compiled[contract_names[contract]].abi;
            let instance, instance_socket;
            if(web3.eth.contract){
                instance = web3.eth.contract(
                    abi,
                    this.addresses[contract]
                );
                instance_socket = web3_socket.eth.contract(
                    abi,
                    this.addresses[contract]
                );
            }else{
                instance = new web3.eth.Contract(
                    abi,
                    this.addresses[contract]
                );
                instance_socket = new web3_socket.eth.Contract(
                    abi,
                    this.addresses[contract]
                );
            }
            instances[contract] = instance;
            instances_socket[contract] = instance_socket;
        }

        this.main   = instances.Main;
        this.main_socket = instances_socket.Main;
    }

    get Main(){
        return this.main;
    }
    get Main_socket(){
        return this.main_socket;
    }


    assign_provider(){
        console.log('assign provider');
        let provider;
        if(window.ethereum) {
            console.log('window.ethereum');
            provider = window.ethereum;
            this.provider_type = "window.ethereum";
            this.injected = true;
        }else if(window.web3 && window.web3.currentProvider){
            console.log('window.web3');
            provider = window.web3.currentProvider;
            this.injected = true;
            this.provider_type = "window.web3";

        }else{
            console.log('infura');
            //infura
            provider = new Web3.providers.HttpProvider(this.provider_fallback);
            this.injected = false;
            this.provider_type = "infura";
        }
        web3 = new Web3(provider);
        web3_socket = new Web3(this.provider_sockets);
    }

    async get_networkId(){
        return await web3.eth.net.getId();
    }

}