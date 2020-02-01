class Game{
    //TODO: to_lower_case all address comparisons

    constructor(contract){
        this.contract = contract;

        this.address_zero = "0x0000000000000000000000000000000000000000";

        this.now = {
            loaded: false,
            failed: false,
            now: 0
        },
        this.stats = {
            loaded: false,

            last_infection: 0,
            infected: 0,
            dead: 0,
        }
        this.data = {
            //address: {
            //      balance: 0,
            //      received: block_number
            //}
        }

        this.infectMe = {
            status: "ready",    //ready, submitted, success, fail
            message: ""
        }
        this.coughs = [
            {
                checking: false,
                show: true,
                infectable: false,
                victim: "0x0",
                status: "ready",    //ready, submitted, success, fail
                message: "",
            },
            {
                checking: false,
                show: true,
                infectable: false,
                victim: "0x0",
                status: "ready",    //ready, submitted, success, fail
                message: "",
            },
            {
                checking: false,
                show: true,
                infectable: false,
                victim: "0x0",
                status: "ready",    //ready, submitted, success, fail
                message: "",
            },

        ];

        this.me = {
            loaded: false,
            failed: false,
            retry: false,

            address:'0x0',
            alive: false,
            death_date: 0,
            immunity: 0,
            pathogens: 0,

            second_to_live: 0,


            status: "",

            tokenIds: [],

            hooks: {
                transaction: ()=>{},
                infection: ()=>{},

            }


        };


        this.get_stats().catch(e => {
            console.log('failed to get stats');
        }).then(()=>{
            console.log('got stats');
        });


        this.get_me().catch(e => {
            console.log('failed to get me');
        }).then(()=>{
            console.log('got me');
        });


        this.get_now().catch(e => {
            console.log("failed to get now");
        }).then(()=>{
           console.log("got now");
        });

        this.init_event_hooks();
        this.init_transaction_hooks();
        this.process_past_transfer_data();


        const game = this;
        this.contract.trigger_new_account = function(){
            game.refresh_me();
        }
    }

    is_same_address(address1,address2){
        return address1.toLowerCase() === address2.toLowerCase();
    }
    process_transfer(from,to,tokenId,block_number){
        //sanitise inputs
        from = from.toLowerCase();
        to = to.toLowerCase();
        block_number = Number(block_number);

        if(this.is_same_address(
            from,
            this.me.address
        )){
            //sent from me,
            const tokenIds = this.me.tokenIds;
            if(tokenIds.includes(tokenId)){
                tokenIds.splice(tokenIds.indexOf(tokenId),1);
            }
            this.me.pathogens--;

        }
        if(this.is_same_address(
            to,
            this.me.address
        )){
            //me infected
            this.refresh_me();
        }
        this.process_infection(to,from);
        this.process_data(from,to,tokenId,block_number);
    }
    process_infection(victim,vector){
        if(!Boolean(this.data[victim]) || this.data[victim].balance === 0){
            if(this.is_same_address(
                vector,
                this.address_zero
            )){
                vector = 0;
            }
            this.trigger_infection(victim,vector);
        }
    }
    trigger_infection(victim,vector){
        //External
    }

    async get_now(){
        this.now.loaded = "loading";
        try{
            this.now.now = Number(await this.contract.get_now());
        }catch(e){
            this.now.loaded = false;
            this.now.failed = true;
        }
        this.now.loaded = "loaded";
    }

    process_data(from,to,tokenId,block_number){
        if(!Boolean(this.data[to])){
            this.data[to] = {
                balance: 1,
                received: block_number
            }
        }else{
            this.data[to].balance++;
            this.data[to].received = Math.max(block_number,this.data[to].received);
        }
        if(!this.is_same_address(from,this.address_zero)){
            if(!Boolean(this.data[from])){
                this.data[from] = {
                    balance: -1,
                    received: 0
                }
            }else{
                this.data[from].balance--;
            }
        }
    }
    async process_past_transfer_data(){
        const game = this;
        const past_transfers = await this.contract.get_past_transfers();
        past_transfers.forEach(evt => {
            const from = evt.returnValues._from.toLowerCase();
            const to = evt.returnValues._to.toLowerCase();
            const block_number = Number(evt.blockNumber);
            const tokenId = evt.returnValues._tokenId;


            game.process_data(
                from,
                to,
                tokenId,
                block_number
            )
        });

        await this.interpret_data();
    }


    async interpret_data(){
        function isDead(block_now,last_transfer){
            return last_transfer + 30240 < block_now;
        }
        const block_number = await this.contract.get_block_number();
        this.stats.dead = 0;
        for(let address in this.data){
            this.stats.dead += isDead(block_number,this.data[address].received);
        }
    }

    init_event_hooks(){
        const game = this;
        this.contract.events.Transfer.hook = (returnValues,block_number) => {
            game.process_transfer(
                returnValues._from,
                returnValues._to,
                returnValues._tokenId,
                block_number
            );
        };
    }
    init_transaction_hooks(){
        const game = this;
        //Hooks
        this.contract.transactions.infectMe.submit = function(data){
            game.infectMe.status = "submitted";
        }
        this.contract.transactions.infectMe.success = function(data){
            game.infectMe.status = "success";
            game.refresh_me();
        }
        this.contract.transactions.infectMe.fail =function(data){
            game.infectMe.status = "fail";
        }
    }

    reset_coughs(){
        this.coughs = [
            {
                checking: false,
                show: this.me.pathogens > 0,
                infectable: false,
                victim: "0x0",
                status: "ready",    //ready, submitted, success, fail
                message: "",

            },
            {
                checking: false,
                show: this.me.pathogens > 1,
                infectable: false,
                victim: "0x0",
                status: "ready",    //ready, submitted, success, fail
                message: "",
            },
            {
                checking: false,
                show: this.me.pathogens > 2,
                infectable: false,
                victim: "0x0",
                status: "ready",    //ready, submitted, success, fail
                message: "",
            }
        ];

    }
    async validate_cough(victim,index){
        // this.coughs[index].infectable = false

        this.coughs[index].victim = victim;
        this.coughs[index].checking = true;

        let token_index = index;
        while(this.me.tokenIds.length - 1 < token_index && token_index > 0){
            token_index--;
        }
        try{
            this.coughs[index].infectable = await this.infectable(victim,token_index);
        }catch(e){

        }
        this.coughs[index].checking = false;

    }


    async infectable(victim,index){
        let tokenIds = this.me.tokenIds;
        if(tokenIds.length === 0) return "healthy";
        let tokenId = tokenIds[index];
        return await this.contract.canInfect(this.me.address,victim,tokenId);
    }

    async get_stats(){
        if(this.stats.loaded) return;
        this.stats.loaded = "loading";

        this.stats.infected = await this.contract.get_INFECTIONS();
        this.stats.last_infection = await this.contract.get_LAST_INFECTION();


        //TODO: maybes in another function, iterate though events,
        // inferring death count from time difference between now and received date

        this.stats.loaded = "loaded";
    }

    refresh_me(){
        if(this.me.loaded === "loading"){
            this.me.retry = true;
        }else{
            this.me.retry =
            this.me.failed =
            this.me.loaded = false;
            this.get_me();
        }
    }

    infect(index){
        console.log(index);
        const victim = this.coughs[index].victim;

        while(this.me.tokenIds.length - 1 < index && index > 0){
            index--;
        }


        this.contract.transferFrom(
            this.me.address,
            victim,
            this.me.tokenIds[index]
        )
    }

    async get_me(){
        if(this.me.loaded || !this.contract.account) return;
        try{
            this.me.loaded = "loading";

            this.me.address = this.contract.account;

            const vitalSigns = await this.contract.vitalSigns(this.me.address);

            this.me.alive = Boolean(vitalSigns.alive);
            this.me.death_date = Number(vitalSigns.death_date);
            this.me.immunity = Number(vitalSigns.immunity);
            this.me.pathogens = Number(vitalSigns.pathogens);


            if(!this.me.alive){
                this.me.status = "dead";
            }else if(this.me.pathogens > 0){
                this.me.status = "infected";
            }else{
                this.me.status = "healthy";
            }
            let now;
            try{
                now = Number(await this.contract.get_now());
            }catch(e){
                console.log('failed to get now');
            }

            this.me.second_to_live = this.me.death_date - now;

            this.me.tokenIds = [];
            for(let i = 0; i < this.me.pathogens; i++){
                try{
                    let tokenId = await this.contract.tokenOfOwnerByIndex(this.me.address,i);
                    this.me.tokenIds.push(tokenId);
                }catch(e){
                    console.log('failed to get token',i);
                }

            }
            this.reset_coughs();

            this.me.loaded = "loaded";
        }catch(e){
            console.log('failed to get me');
            console.log(e);
            this.me.failed = true;
            this.me.loaded = false;
        }
        if(this.me.retry){
            this.me.retry =
            this.me.failed =
            this.me.loaded = false;
            this.get_me();
        }

    }




}