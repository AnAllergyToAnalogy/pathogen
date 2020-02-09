class Site {
    constructor() {
        var site = this;
        const provider_fallback = "https://mainnet.infura.io/v3/2d9d3459d7ef4188a43973a98b27cef7";

        let instance = new Instance(provider_fallback);



        let contract = new Contract(instance);
        this.contract = contract;

        this.game = new Game(contract);
        // this.page = null;

        this.graph = {
            drawn: false,
            xMin: 0,
            xMax: 1,
            yMin: 0,
            yMax: 1,
            width: 100,
            height: 100
        }



        this.refresh_page();

        this.init_page();
        this.init_hooks();

        this.update_leaderboard();

        this.game.trigger_infection = (victim,vector) => {
            this.display_new_infection(victim,vector);
        }

        this.game.trigger_leaderboard_update = () =>{
            this.update_leaderboard();
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

    update_leaderboard(){
        var leaderboard = this.game.leaderboard;
        _.ById("leaderboard").Show(
            leaderboard.length > 0
        );
        _.ById("leaderboard").SetHTML(
            '<div class="leaderboard-title">Most dangerous vectors</div>'

        );
        for(let l = 0; l < leaderboard.length; l++){

            let leader;
            if(leaderboard[l].name !== "?"){
                leader = leaderboard[l].name;
            }else{
                leader = leaderboard[l].address;//.substring(0,8)+'...';
            }

            this.add_leader(l+1,
                leaderboard[l].infections,
                leader,
                leaderboard[l].address
            );
        }
    }
    add_leader(position,infections,leader,address){
        _.ById("leaderboard").innerHTML +=
            "<div class='leaderboard-item'>" +
            "<span>"+position+".</span>" +
            "<a class='leaderboard-address' href='https://etherscan.io/address/"+address+"'>"+leader+"</a>"+
            "<span>"+infections+" infections</span>" +
            "</div>";
    }

    check_graph(){

        if(!this.graph.drawn
            && this.game.graph.length > 0
            && this.game.block_number.loaded === "loaded"
        ){
            if(window.innerWidth <= 600) {
                //Mobile
                this.redraw_graph(
                    window.innerWidth - 80
                );
            }else if(window.innerWidth <= 768){
                //Tablet phablet dablet
                this.redraw_graph(
                    480
                );
            }else{
                //Real computer
                this.redraw_graph(
                    400
                );
            }

        }
    }
    clear_graph(){
        this.graph.drawn = false;
    }

    redraw_graph(width){
        const site = this;

        function X_to_x(X){
            const G = site.graph;
            return (X - G.xMin)/(G.xMax - G.xMin) * G.width;
        }
        function Y_to_y(Y){
            const G = site.graph;
            return ( 1 - (Y - G.yMin)/(G.yMax - G.yMin)) * G.height;
        }

        const height = Math.round(width/3*2);
        const G = this.graph;
        const GG = this.game.graph;

        if(GG.length == 0) return;

        G.width = width;
        G.height = height;

        //TODO: set limits
        G.yMax = Math.round(GG[GG.length-1].infections * 1.2);
        G.xMin = GG[0].block;
        G.xMax = this.game.block_number.block_number;

        const xDif =
                Math.round((G.xMax - G.xMin) / 3 /* minutes */
                / 60 /* hours */
                / 24 /* days */);

        _.ById("graph-yMax").SetText(G.yMax);
        _.ById("graph-xMax").SetText(xDif);

        const canvas = _.ById("graph-canvas");
        canvas.width = width;
        canvas.height = height;

        _.ById("graph-labels-y").height = height;
        _.ById("graph-labels-x").style = "width:"+width+"px";

        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeRect(0, 0, G.width, G.height);

        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        for(let j = 1; j < 10; j++){
            ctx.moveTo(0,j/10 * G.height);
            ctx.lineTo(G.width,j/10 * G.height);

            ctx.moveTo(j/10 * G.width, 0);
            ctx.lineTo(j/10 * G.width, G.height);
        }
        ctx.stroke();


        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 3;
        ctx.moveTo(0, G.height);

        for(let i = 0; i < GG.length; i++){
            ctx.lineTo(
                X_to_x(GG[i].block),
                Y_to_y(GG[i].infections)
            )
        }

        ctx.stroke();
        this.graph.drawn = true;
    }


    init_page(){
        let G = this.game;
        let site = this;

        window.onresize = function(){
            site.clear_graph();
        };
        window.onorientationchange = function(){
            site.clear_graph();
        };

        _.ById("button-unlock").OnClick((e)=>{
            site.game.contract.unlock();
        });
        _.ById("info-me-unlock").OnClick((e)=>{
            site.game.contract.unlock();
        });



        _.ById("button-infectMe").OnClick((e)=>{
            site.game.contract.infectMe();
        });

        // _.ById("button-check");
        _.ById("button-check").OnClick(async (e)=>{
            site.game.validate_cough(
                _.ById("input-infect").value.trim()
            );
        });
        _.ById("button-infect").OnClick((e)=>{
            site.game.infect();
            _.ById("input-infect").value = "";
        });

        _.ById("input-infect").onkeyup =
        _.ById("input-infect").onchange = (e)=>{
            site.game.reset_cough();
        }



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


            _.ById("graph-table").Show(site.graph.drawn);
            site.check_graph();


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

            const me_loaded = G.me.loaded   === "loaded";
            const me_infected = G.me.status === "infected";
            const me_dead = G.me.status     === "dead";
            const me_healthy = G.me.status  === "healthy";

            _.ById("info-me-status-infected").Show(me_infected);
            _.ById("info-me-status-dead").Show(me_dead);
            _.ById("info-me-status-healthy").Show(me_healthy);

            _.ById("my-data").Show(G.contract.isUnlocked());
            _.ById("me-infected").Show(me_infected && me_loaded);
            _.ById("me-dead").Show(me_dead && me_loaded);
            _.ById("me-healthy").Show(me_healthy && me_loaded);

            if(G.me.loaded === "loading"){
                _.ById("me-loading").Show(true);
                _.ById("me-loading").SetText("Loading data...");
            }else if(G.me.failed){
                _.ById("me-loading").Show(true);
                _.ById("me-loading").SetText("Failed to load data.");
            }else{
                _.ById("me-loading").Show(false);
            }

            if(me_infected){
                _.ById("infected-strain").SetText(site.format_strain(G.me.immunity));
                _.ById("infected-death-date").SetText(site.format_future_death_date(G.me.death_date));
                _.ById("infected-cough-count").SetText(site.format_cough_count(G.me.pathogens));

                _.ById("infected-infected-by").Show(Boolean(site.game.infected_by));
                if(site.game.infected_by){
                    _.ById("infected-infected-by-address").SetText(site.game.infected_by);
                    _.ById("infected-infected-by-address").href = "https://etherscan.io/address/"+site.game.infected_by;
                }
                _.ById("button-check").Show((G.cough.infectable !== "okay"
                    || (G.cough.status === "success") || (G.cough.status === "fail")
                    )&& !G.cough.checking
                );
                if(G.cough.status === "success"){
                    _.ById("button-check").SetText("Infect another");
                }else if(G.cough.status === "fail"){
                    _.ById("button-check").SetText("Try again");
                }

                _.ById("input-infect").Show(
                    G.cough.status !== "submitted"
                );
                _.ById("input-infect").disabled = G.cough.checking;


                _.ById("button-infect").Show(
                    G.cough.infectable === "okay"
                    && !G.cough.checking
                    && G.cough.status === "ready"
                );

                let message ="";
                switch(G.cough.status){
                    case "ready":
                        switch(G.cough.infectable){
                            case false:
                                message = "";
                                break;
                            case "ens_bad":
                                message = "Error: Bad ENS name"
                                break;
                            case "error":
                                message = "Error: Check address";
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
            }


            if(me_dead){
                _.ById("dead-death-date").SetText(site.format_past_death_date(G.me.death_date));
                _.ById("dead-strain").SetText(site.format_strain(G.me.immunity));

                _.ById("dead-infected-by").Show(Boolean(site.game.infected_by));
                if(site.game.infected_by){
                    _.ById("dead-infected-by-address").SetText(site.game.infected_by);
                    _.ById("dead-infected-by-address").href = "https://etherscan.io/address/"+site.game.infected_by;
                }
            }
            if(me_healthy){
                _.ById("me-immune").Show(G.me.immunity > 0);
                _.ById("me-not-immune").Show(G.me.immunity === 0);
                _.ById("healthy-strain").SetText(site.format_strain(G.me.immunity));

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
            }



            window.requestAnimationFrame(do_refresh_page);
        }
        do_refresh_page();
    }



    init_hooks(){

    }
}