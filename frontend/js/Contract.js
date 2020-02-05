class Contract{
    constructor(instances) {
        this.account = null;
        this.instances = instances;

        this.networkId = -1;
        this.networkId_required = 4;
        this.update_networkId();


        this.Main = this.instances.Main.methods;
        this.pending_transactions = 0;
        this.events = {
            Transfer: {
                hook: (returnValues,block_number) => {
                },
                funcs: [
                    "transferFrom",
                    "infectMe",
                    "patientZero",
                ]
            },
        }
        this.transactions = {
            patientZero: {
                // events: events,
                pending: {},
                submit: null,       //Tx submitted
                success: null,      //Tx successful
                fail: null,         //Tx failed
            },
            infectMe: {
                // events: events,
                pending: {},
                submit: null,       //Tx submitted
                success: null,      //Tx successful
                fail: null,         //Tx failed
            },
            vaccinate: {
                // events: events,
                pending: {},
                submit: null,       //Tx submitted
                success: null,      //Tx successful
                fail: null,         //Tx failed
            },
            setApprovalForAll: {
                // events: events,
                pending: {},
                submit: null,       //Tx submitted
                success: null,      //Tx successful
                fail: null,         //Tx failed
            },
            transferFrom: {
                // events: events,
                pending: {},
                submit: null,       //Tx submitted
                success: null,      //Tx successful
                fail: null,         //Tx failed
            },

        }
        this.subscribe_to_events();
        this.init_account_monitor();
        this.init_network_monitor();
        this.init_unlock();
    }

    async init_unlock(){
        let alreadyUnlocked = await this.isAlreadyUnlocked();
        if(alreadyUnlocked){
            this.unlock();
        }
    }

    subscribe_to_events(){
        const history = {

        };
        function log_event(evt){
            if(!evt || history[evt.id]) return false;
            return history[evt.id] = true;

        }
        console.log('subscribe to events');
        this.instances.Main_socket.events.allEvents({fromBlock:'latest'},(e,evt)=>{
            if(!log_event(evt)) return false;
            console.log('Event, Main');
            console.log(evt);
            this.trigger_event(evt.event,evt.transactionHash,evt.returnValues,evt.id,evt.blockNumber);
        });
    }

    async get_past_transfers(){
        // this.instances.Main.getPastEvents("allEvents")
        return await this.instances.Main.getPastEvents("Transfer",{
            fromBlock:1,
            toBlock: 'latest'});
    }

    trigger_event(event_name,txHash,returnValues,log_id,block_number){
        console.log(">>",event_name);
        this.events[event_name].hook(returnValues,block_number);
        if(this.pending_transactions === 0) return;
        const funcs = this.events[event_name].funcs;
        for(let f = 0; f < funcs.length; f++){
            const tx = this.transactions[funcs[f]];
            for(let hash in tx.pending){
                if(hash === txHash){
                    if(tx.success){
                        tx.success(tx.pending[hash]);
                    }
                    this.pending_transactions--;
                    return;
                }
            }
        }

    }


    init_network_monitor(){
        if(window.ethereum && window.ethereum.on){
            window.ethereum.on('chainChanged', chainId => {
                this.update_networkId();
            })
        }
    }
    async update_networkId(){
        //TODO: other stuff consequential to having correct/incorrect network
        //  checking vs networkId_required
        this.networkId = await this.instances.get_networkId();
    }


    init_account_monitor(){
        let contract = this;
        if(window.ethereum && window.ethereum.on) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if(!contract.account) return;
                await this.unlock();
                this.trigger_new_account();
            });
        }
    }
    async get_accounts(){
        try{
            let accounts = await web3.eth.getAccounts();
            console.log('got accounts');
            if(accounts[0]){
                this.account = accounts[0];
            }
        }catch(e){
            console.log('get accounts fail');
        }
    }

    async unlock(){
        try{
            let accounts;
            if(window.ethereum && ethereum.enable){
                accounts = await ethereum.enable();
                await this.get_accounts();
                if(!accounts){
                    console.log('something fucked up, fallback to hard get');
                    await this.get_accounts();
                }

            }else{
                await this.get_accounts();
            }
            this.trigger_new_account();
            return true;
        }catch(e){
            console.log('denied, not unlocked');
            return false;
        }
    }
    trigger_new_account(){
        //pass upwards
    }
    async isAlreadyUnlocked(){
        if(!this.instances.injected) return false;

        return (await web3.eth.getAccounts()).length > 0;
    }
    isUnlocked(){
        return Boolean(this.account);
    }
    isCorrectNetwork(){
        // return this.networkId > 100;
        return this.networkId === this.networkId_required;
    }


    //== GET ==
    async get_now(){
        return await this.Main.get_now().call();
    }
    async get_block_number(){
        return await this.Main.get_block_number().call();
    }
    async get_STRAIN(tokenID){
        return await this.Main.STRAINS(tokenID).call();
    }
    async get_LAST_INFECTION(){
        return await this.Main.LAST_INFECTION().call();
    }
    async get_INFECTIONS(){
        return await this.Main.INFECTIONS().call();
    }

    async canInfect(vector,victim,tokenId){
        try{
            return await this.Main.canInfect(vector,victim,tokenId).call();
        }catch(e){
            return "error";
        }

    }
    async vitalSigns(patient){
        return await this.Main.vitalSigns(patient).call();
    }
    async balanceOf(owner){
        return await this.Main.balanceOf(owner).call();
    }
    async ownerOf(tokenId){
        return await this.Main.ownerOf(tokenId).call();
    }

    async tokenURI(tokenId){
        return await this.Main.tokenURI(tokenId).call();
    }
    async name(){
        return await this.Main.name().call();
    }
    async symbol(){
        return await this.Main.symbol().call();
    }

    async totalSupply(){
        return await this.Main.totalSupply().call();
    }
    async tokenByIndex(index){
        return await this.Main.tokenByIndex(index).call();
    }
    async tokenOfOwnerByIndex(owner,index){
        return await this.Main.tokenOfOwnerByIndex(owner,index).call();
    }

    async getApproved(tokenId){
        return await this.Main.getApproved(tokenId).call();
    }
    async isApprovedForAll(owner,operator){
        return await this.Main.isApprovedForAll(owner,operator).call();
    }

    doTx(contractAddress,data,func,value,callbackData){
        if(!this.isUnlocked()){
            console.log("Not unlocked");
            return false;
        }

        if(!callbackData){
            callbackData = {};
        }

        if(!value){
            value = 0;
        }
        const tx = this.transactions[func];
        web3.eth.sendTransaction({
            from: this.account,
            to: contractAddress,
            data: data.encodeABI(),
            value: value,
        },(err,hash)=>{
            console.log('Requested');
            if(err){
                console.log('Denied');
                if(tx.fail){
                    tx.fail(callbackData);
                }
                return;
            }
            if(hash){
                console.log('Sent');
                console.log(hash);
                // tx.hashes.push(hash);
                tx.pending[hash] = callbackData;

                this.pending_transactions++;

                //TODO: subscribe to event if it isn't already subscribed
                if(tx.submit){
                    tx.submit(callbackData);
                }
            }
        });
        return true;
    }
    txMain(data,func,value,callbackData){
        return this.doTx(
            this.instances.Main.options.address,
            data,func,value,callbackData
            );

        //Let events handle the tx receipt

        //     .then((receipt)=>{
        //     console.log('Mined');
        //     // console.log(receipt);
        //
        //     //TODO: do mor with this hash thing maybes
        //     delete tx.pending[receipt.transactionHash];
        //
        //     if(callbacks.success){
        //         callbacks.success(receipt);
        //     }
        //     if(tx.success){
        //         tx.success(receipt);
        //     }
        //
        // });
    }

    async patientZero(){
        let data = this.Main.patientZero();
        return this.txMain(data,"patientZero");
    }
    async infectMe(){
        let data = this.Main.infectMe();
        return this.txMain(data,"infectMe");
    }
    async vaccinate(tokenId,vaccine){
        let data = this.Main.vaccinate(tokenId,vaccine);
        return this.txMain(data,'vaccinate');
    }


    async approve(approved,tokenId){
        let data = this.Main.approve(approved,tokenId);
        return this.txMain(data,'approve');
    }
    async setApprovalForAll(operator,approved){
        let data = this.Main.setApprovalForAll(operator,approved);
        return this.txMain(data,'setApprovalForAll');
    }
    async transferFrom(from,to,tokenId){
        console.log('transferFrom',from,to,tokenId);
        let data = this.Main.transferFrom(from,to,tokenId);
        return this.txMain(data,'transferFrom');
    }

}



