# 2020-nEthV EtherVirus

Cbf with readme.

[Read this article](https://medium.com/@anallergytoanalogy/2020-nethv-the-ethervirus-2788fa140de4)


[Published contract is here](https://etherscan.io/address/0xae26a1488c38d187ff2f52ae59158edbedcb4069#code) 
at address [0xae26A1488c38D187ff2F52ae59158edbEDcB4069](https://etherscan.io/address/0xae26a1488c38d187ff2f52ae59158edbedcb4069)




Soooo I screwed up a little with the smart contract... It works completely fine, but I must have been working from a late draft version of the EIP rather than the finalised one. As such, the interfaceId for the ERC165 check of the main contract is wrong. Also, one of the parameters in the Transfer event isn't indexed. 

What does this mean? It means the contract works just fine. Nothing will get stuck, but it means other projects might not recognise it as fully 721 compliant. Etherscan thinks its an ERC20 token. 

There is a lesson to be learned here people:

### Do not deploy projects at 3am without unit testing first.
 
 I have no problem admitting when I was wrong though. It is what it is.