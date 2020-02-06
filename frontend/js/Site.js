class Site {
    constructor() {
        var site = this;
        // const provider_fallback = "http://127.0.0.1:8545";
        const provider_fallback = "https://rinkeby.infura.io/v3/2d9d3459d7ef4188a43973a98b27cef7";

        let instance = new Instance(provider_fallback);



        let contract = new Contract(instance);
        this.contract = contract;

        this.game = new Game(contract);
        // this.page = null;

        this.refresh_page();

        this.init_page();
        this.init_hooks();

        this.game.trigger_infection = (victim,vector) => {
            this.display_new_infection(victim,vector);
        }
    }


    display_new_infection(victim,vector){
        victim = victim.substring(0,7)+"...";
        if(!vector){
            _.ById("ticker").SetText(victim+" became infected.");
        }else{
            vector = vector.substring(0,7)+"...";
            _.ById("ticker").SetText(vector+" infected "+victim);
        }
    }


    format_strain(strain_number){
        return "2020-nEthV-"+strain_number;
    }
    format_cough_count(cough_count){
        if(cough_count == 1){
            return "1 person";
        }else{
            return cough_count+" people";
        }
    }
    format_future_death_date(death_date){
        //todo this
        return this.format_seconds_from_now(death_date);
    }
    format_past_death_date(death_date){
        //todo this
        return this.format_seconds_from_now(death_date);
    }

    format_seconds_from_now(date_seconds){
        if(this.game.now.loaded === "loaded"){
            let now = this.game.now.now;

            let seconds = Math.abs(date_seconds - now);

            if(seconds === 1){
                return "1 second";
            }else if(seconds < 60){
                return seconds+" seconds"
            }
            let minutes = Math.round(seconds/60);
            if(minutes === 1){
                return "1 minute";
            }else if(minutes < 60){
                return minutes+" minutes";
            }
            let hours = Math.round(minutes/60);
            if(hours === 1) {
                return "1 hour";
            }else if(hours < 24){
                return hours+" hours";
            }
            let days = Math.round(hours/24);
            if(days === 1){
                return "1 day";
            }else{
                return days+" days";
            }
        }else{
            return "a while";
        }
    }


    init_page(){
        let G = this.game;
        let site = this;
        _.ById("button-unlock").OnClick((e)=>{
            site.game.contract.unlock();
        });
        _.ById("info-me-unlock").OnClick((e)=>{
            site.game.contract.unlock();
        });



        _.ById("button-infectMe").OnClick((e)=>{
            site.game.contract.infectMe();
        });

        _.ById("button-check");
        _.ById("button-check").OnClick(async (e)=>{
            site.game.validate_cough(
                _.ById("input-infect").value
            );
        });
        _.ById("button-infect").OnClick((e)=>{
            site.game.infect()
        });


    }
    refresh_page(){
        let G = this.game;
        let site = this;



        function do_refresh_page(){

            if(site.game.contract.networkId === -1){
                _.ById("prompt-loading").Show(true);
                _.ById("prompt-network").Show(false);
                _.ById("section-main").Show(false);
            }else{
                _.ById("prompt-loading").Show(false);
                _.ById("prompt-network").Show(
                    !site.game.contract.isCorrectNetwork()
                );
                _.ById("section-main").Show(
                    site.game.contract.isCorrectNetwork()
                );
            }




            // log_clear();
            // log("me:"+site.game.me.loaded+","+site.game.me.failed);
            // log("stats:"+site.game.stats.loaded);
            // log("injected:"+site.game.contract.instances.injected);
            // log("window.ethereum:"+window.ethereum);
            // log("window.ethereum.networkVersion:"+window.ethereum.networkVersion);
            // log("window.web3:"+window.web3);
            // log("window.web3.currrentProvider:"+window.web3.currentProvider);
            // log("web3:"+web3);


            if(!G.virus_is_live()){
                _.ById("ticker").SetText("Virus is extinct");
            }

            if(G.stats.loaded === "loaded"){
                _.ById("readout-infections").SetText(G.stats.infected);
                _.ById("readout-deaths").SetText(G.stats.dead);
            }else{
                _.ById("readout-infections").SetText("---");
                _.ById("readout-deaths").SetText("---");
            }

            _.ById("section-unlock").Show((
                !G.contract.isUnlocked() &&
                G.contract.instances.injected)
            );
            _.ById("info-me-unlock").Show((
                !G.contract.isUnlocked() &&
                G.contract.instances.injected)
            );
            _.ById("info-me-status").Show(
                G.me.loaded === "loaded"
            );

            _.ById("info-me-status-healthy").Show(G.me.status === "healthy");
            _.ById("info-me-status-dead").Show(G.me.status === "dead");
            _.ById("info-me-status-infected").Show(G.me.status === "infected");


            _.ById("my-data").Show(G.contract.isUnlocked());
            _.ById("me-infected").Show(G.me.status === "infected");
            _.ById("me-dead").Show(G.me.status === "dead");
            _.ById("me-healthy").Show(G.me.status === "healthy");


            if(G.me.loaded === "loading"){
                _.ById("me-loading").Show(true);
                _.ById("me-loading").SetText("Loading data...");
            }else if(G.me.failed){
                _.ById("me-loading").Show(true);
                _.ById("me-loading").SetText("Failed to load data.");
            }else{
                _.ById("me-loading").Show(false);
            }

            if(G.me.loaded === "loaded"){
                _.ById("infected-strain").SetText(site.format_strain(G.me.immunity));
                _.ById("infected-death-date").SetText(site.format_future_death_date(G.me.death_date));
                _.ById("infected-cough-count").SetText(site.format_cough_count(G.me.pathogens));

                _.ById("dead-death-date").SetText(site.format_past_death_date(G.me.death_date));
                _.ById("dead-strain").SetText(site.format_strain(G.me.immunity));
            }else{
                _.ById("infected-strain").SetText("---");
                _.ById("infected-death-date").SetText("---");
                _.ById("infected-cough-count").SetText("---");

                _.ById("dead-death-date").SetText("---");
                _.ById("dead-strain").SetText("---");
            }

            _.ById("button-infectMe").Show(G.infectMe.status === "ready");
            switch(G.infectMe.status){
                case "ready":
                    _.ById("message-infectMe").SetText("");
                    break;
                case "submitted":
                    _.ById("message-infectMe").SetText("Transaction pending...");
                    break;
                case "success":
                    _.ById("message-infectMe").SetText("You are now infected!");
                    break;
                case "fail":
                    _.ById("message-infectMe").SetText("Transaction failed :(");
                    break;
            }

            _.ById("button-check").Show(G.cough.infectable !== "okay"
                && !G.cough.checking
            );
            _.ById("button-infect").Show(G.cough.infectable === "okay"
                && !G.cough.checking
            );

            let message ="";
            switch(G.cough.status){
                case "ready":
                    switch(G.cough.infectable){
                        case false:
                            message = "";
                            break;
                        case "error":
                            message = "Error: check address";
                            break;
                        case "okay":
                            message = "Victim can be infected";
                            break;
                        case "victim_inactive":
                            message = "Victim account must have Ether";
                            break;

                        case "victim_dead":
                            message = "Victim is already dead";
                            break;
                        case "victim_immune":
                            message = "Victim is immune";
                            break;
                        case "victim_sick":
                            message = "Victim is already sick";
                            break;
                        case "vector_healthy":
                            message = "You aren't sick'";
                            break;
                    }
                    break;
                case "submitted":
                    message = "Transaction pending...";
                    break;
                case "success":
                    message = "Victim successfully infected!";
                    break;
                case "fail":
                    message = "Transaction failed :(";
                    break;

            }
            if(G.cough.checking){
                message = "Checking victim...";
            }
            _.ById("readout-infect").SetText(message);


            window.requestAnimationFrame(do_refresh_page);
        }
        do_refresh_page();
    }



    init_hooks(){

    }
}

// await web3.eth.ens.resolver("ethereum.eth")

//todo: namehash (probs have to reverse engineer)

// async function Reverse(address) {
//     var lookup=address.toLowerCase().substr(2) + '.addr.reverse'
//     var ResolverContract=await web3.eth.ens.resolver(lookup);
//     var nh=namehash.hash(lookup);
//     var name=await ResolverContract.methods.name(nh).call()
//     return name;


//0x217D29BB236A4a082d1999043060360e161F18f9