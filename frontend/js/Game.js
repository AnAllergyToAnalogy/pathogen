class Game{
    //TODO: to_lower_case all address comparisons

    constructor(contract,referralId){
        this.contract = contract;

        this.address_zero = "0x0000000000000000000000000000000000000000";

        this.stats = {
            loaded: false,

            infected: 0,
            dead: 0,
        }

        this.me = {
            loaded: false,

            address:'0x0',
            alive: false,
            death_date: "0",
            immunity: "0",
            pathogens: "0",

            hooks: {
                transaction: ()=>{},
                draw: ()=>{},

            }
        };



        this.get_jackpot().catch(e => {
            console.log('failed to get jackpot data');
        }).then(()=>{
            console.log('got jackpot');
            this.get_draw();
            this.get_bonds();
            this.get_me();
        });

        this.init_event_hooks();
    }

    is_same_address(address1,address2){
        return address1.toLowerCase() === address2.toLowerCase();
    }

    init_event_hooks(){
        this.contract.events.Transfer.hook = (returnValues) => {
            console.log('transfer');
            console.log(returnValues);

            // returnValues._from;
            // returnValues._to;
            if(this.is_same_address(returnValues._from, this.me.address) ){
                //delete ticket
                this.remove_my_ticket(returnValues._tokenId);
            }else if(this.is_same_address(returnValues._to, this.me.address)){
                //add ticket
                this.load_my_ticket(returnValues._tokenId);
            }

            if(this.is_same_address(returnValues._from,this.address_zero)){
                //Increment jackpot etc
                this.increment_takings();
            }
        };
        this.contract.events.BuyBonds.hook = (returnValues) => {
            if(this.is_same_address(returnValues.james,this.me.address)){
                this.add_my_bonds(returnValues.value);
            }
            this.add_bonds(returnValues.value);
        };
        this.contract.events.PayoutBonds.hook = (returnValues) => {
            if(this.is_same_address(returnValues.james,this.me.address)){
                this.payout_my_bonds(returnValues.jackpot_number);
            }
        };

        this.contract.events.Draw.hook = (returnValues) => {
            this.process_draw(
                returnValues.draw_number,
                returnValues.jackpot_number,
                returnValues.A,
                returnValues.B,
                returnValues.C,
                returnValues.jackpot_won,
                returnValues.jackpot,
                returnValues.funpot_winner,
                returnValues.funpot,
                returnValues.worker
            );
        };
        this.contract.events.ClaimPrize.hook = (returnValues) => {
            if(!this.is_same_address(returnValues.winner,this.me.address)) return;
            this.clear_ticket(returnValues.tokenId);
        };
        this.contract.events.ClaimReward.hook = (returnValues) => {
            if(returnValues.referralId !== this.me.referralId) return;
            this.update_earnings(0);

        };

        this.contract.events.RegisterCode.hook = (returnValues) => {
            if(!this.is_same_address(returnValues.referrer,this.me.address)) return;
            this.register_new_referralCode(returnValues.referralId);
        };

        this.contract.events.Reinvest.hook = (returnValues) => {
            if(returnValues.referralId !== this.me.referralId) return;
            this.update_earnings(returnValues.earnings_updated);
        };
        this.contract.events.ReinvestShares.hook =
            this.contract.events.CollectShares.hook = (returnValues) => {
                if(returnValues.referralId !== this.me.referralId) return;
                this.clear_shares(returnValues.jackpot_number,returnValues.kickback);
            };
    }


    async get_me(){
        if(this.me.loaded || !this.contract.account) return;
        try{
            this.me.loaded = "loading";

            this.me.address = this.contract.account;

            const referral = await this.contract.get_REFERRAL(this.referralId);
            // referral.referrer;
            // referral.code;
            // referral.earnings;


            if(this.is_same_address(this.me.address , referral.referrer)){
                this.me.referralId = this.referralId;
                this.me.referrals.earnings = referral.earnings;
            }

            this.me.ticket_count = await this.contract.get_ticket_count(this.me.address);

            //Async time baby
            this.get_my_tickets();
            this.get_my_shares();
            this.get_my_bonds();

            this.me.loaded = "loaded";
        }catch(e){
            console.log('failed to get me');
            console.log(e);
            this.me.loaded = false;
        }

    }




}