class Site {
    constructor() {
        var site = this;
        const provider_fallback = "http://127.0.0.1:8545";

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


        _.ById("button-infectMe").OnClick((e)=>{
            site.game.contract.infectMe();
        });

        for(let i = 0; i <3; i++){
            _.ById("button-check-"+i).num = i;
            _.ById("button-check-"+i).OnClick(async (e)=>{
                const num = e.target.num;
                site.game.validate_cough(
                    _.ById("input-infect-"+num).value,e.target.num
                );
            });
            _.ById("button-infect-"+i).num = i;
            _.ById("button-infect-"+i).OnClick((e)=>{
                const num = e.target.num;
                site.game.infect(num)
            });

        }

    }
    refresh_page(){
        let G = this.game;
        let site = this;

        function do_refresh_page(){
            // if(!site.game.me.loaded
            //     && site.game.contract.isUnlocked()
            //     && !site.game.me.failed
            // ){
            //     site.game.get_me();
            // }

            if(G.stats.loaded === "loaded"){
                _.ById("readout-infections").SetText(G.stats.infected);
                _.ById("readout-deaths").SetText(G.stats.dead);
            }else{
                _.ById("readout-infections").SetText("---");
                _.ById("readout-deaths").SetText("---");
            }

            _.ById("button-unlock").Show(!G.contract.isUnlocked());


            _.ById("my-data").Show(G.contract.isUnlocked() && G.me.loaded === "loaded");
            _.ById("me-infected").Show(G.me.status === "infected");
            _.ById("me-dead").Show(G.me.status === "dead");
            _.ById("me-healthy").Show(G.me.status === "healthy");


            if(G.me.loaded === "loading"){
                _.ById("unlock-status").Show(true);
                _.ById("unlock-status").SetText("Loading data...");
            }else if(G.me.failed){
                _.ById("unlock-status").Show(true);
                _.ById("unlock-status").SetText("Failed to load data.");
            }else{
                _.ById("unlock-status").Show(false);
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

            for(let i = 0 ; i < 3; i++){
                _.ById("infector-"+i).Show(G.coughs[i].show);
                _.ById("button-check-"+i).Show(G.coughs[i].infectable !== "okay"
                    && !G.coughs[i].checking
                );
                _.ById("button-infect-"+i).Show(G.coughs[i].infectable === "okay"
                    && !G.coughs[i].checking
                );

                let message ="";
                switch(G.coughs[i].status){
                    case "ready":
                        switch(G.coughs[i].infectable){
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
                if(G.coughs[i].checking){
                    message = "Checking victim...";
                }
                _.ById("readout-infect-"+i).SetText(message);
            }


            window.requestAnimationFrame(do_refresh_page);
        }
        do_refresh_page();
    }



    init_hooks(){

    }
}