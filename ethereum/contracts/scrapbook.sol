pragma solidity >=0.4.22 <0.6.0;

contract Test{

        //tokenId => strain
    mapping (uint => uint)      strains;
    mapping (address => uint)   immunity;
    mapping (address => uint)   coughs; //<token balance
    mapping (address => uint)   death_date;

    uint constant INFECTIOSNESS = 3;

    function infect(address vector, address victim, uint _tokenId) public{
        require(victim.balance > 0,"victim_inactive");

        require(death_date[victim] == 0 || now < death_date[victim],"victim_dead");
        require(strains[_tokenId] > immunity[victim],"victim_immune");
        require(coughs[victim] == 0,"victim_sick");

        require(now < death_date[vector],"vector_dead");
        require(coughs[vector] > 0,"vector_healthy");

        death_date[victim] = now + 1 weeks;
        coughs[victim] = 3;
        //transfer this token and mint 2 more the same


    }


    function vaccinate(uint tokenId, uint vaccine) public view returns(uint){


        uint vaccine_processed_0 = uint(0) - uint(keccak256(abi.encodePacked(vaccine)));
        uint vaccine_processed_1 = uint(keccak256(abi.encodePacked(vaccine_processed_0)));

        return strains[tokenId] - vaccine_processed_1;

        // uint strain = uint(0) - uint(vaccine_bytes);

        // return strain;
        //        return a ^ b;
    }

}