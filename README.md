![zkSync](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/31a75e5e-30a7-41cc-89d5-15e954f7339e)

# A Comprehensive Guide for Establishing a Decentralised Autonomous Organisation (DAO) on zkSync Era

This tutorial provides a step-by-step method for creating and implementing a Decentralised Autonomous Organisation (DAO) on the zkSync era blockchain, a layer 2 scaling solution for Ethereum using [zksync-cli](https://docs.zksync.io/build/tooling/zksync-cli/commands/create.html). The Solidity smart contract utilizes [OpenZeppelin components](https://www.openzeppelin.com/contracts) for improved functionality and security.

## Table of Contents

- [Section 1: Recognising the Fundamentals](#section-1-recognising-the-fundamentals)
  - [1.1 Overview of zksync Blockchain and DAOs](#11-overview-of-zksync-blockchain-and-daos)
  - [Prerequisites](#prerequisites)
- [Section 2: Smart Contract Development](#section-2-smart-contract-development)
  - [2.1 Getting Started with zksync-cli](#21-getting-started-with-zksync-cli)
- [Section 3: Code Explanation of the Smart Contracts](#section-3-code-explanation-of-the-smart-contracts)
  - [3.1 The Control of Roles and Access](#31-the-control-of-roles-and-access)
  - [3.2 Formulation of Proposals](#32-formulation-of-proposals)
- [Section 4: Involvement of Stakeholders](#section-4-involvement-of-stakeholders)
  - [4.1 Supporting the DAO](#41-supporting-the-dao)
  - [4.2 The Voting Process](#42-the-voting-process)
- [Section 5: Proposal Execution and Payments](#section-5-proposal-execution-and-payments)
  - [5.1 Payment Logic](#51-payment-logic).
  - [5.2 Single Proposal](#52-single-proposal)
  - [5.3 All proposals](#53-all-proposals)
  - [5.4 Proposal Vote](#54-proposal-votes)
- [Section 6: Stakeholders and Contributors](#section-6-stakeholders-and-contributors)
  - [6.1 Stakeholder Votes](#61-stakeholder-votes)
  - [6.2 Stakeholder Balance](#62-stakeholder-balance)
  - [6.3 DAO Total Balance](#63-dao-total-balance)
  - [6.4 Stakeholder Status](#64-stakeholder-status)
  - [6.5 Contributor Status](#65-contributor-status)
  - [6.6 Contributor Balance](#66-contributor-balance)
  - [6.7 Deployer Address](#67-deployer-address)
- [Section 7: Compile and Deploy](#section-7-compile-and-deploy)
  
 
## Section 1: Recognising the Fundamentals


### 1.1 Overview of zkSync era Blockchain and DAOs

zkSync is a Layer 2 scaling solution for Ethereum which is designed to enhance the scalability and increase the transaction throughput of the Ethereum network by reducing transaction costs while ensuring security and decentralization. 

A Decentralized Autonomous Organization (DAO) is known as an organization on the blockchain. It is a decentralized organization built on the blockchain, which is secured, transparent, controlled by organization members, and not influenced by any central authority. They are programmed to automate decisions and facilitate cryptocurrency transactions.

### 1.2 Prerequisites

* Basic understanding of Solidity.
* Visual studio code (VS code) or remix ide.
* Faucet: Follow this guide to obtain [zkSync faucet](https://docs.zksync.io/build/tooling/network-faucets.html).
* Node js is installed on your machine.

## Section 2: Smart Contract Development

### 2.1 Getting Started with zksync-cli

We can leverage on zksync-cli to kickstart our project which offers templates for frontend development, smart contracts, and scripting for zkSync, enabling rapid deployment and development.

Navigate to the terminal and run the command below to get started with our project.

`npx zksync-cli create dao-tutorial --template hardhat_solidity`

`dao-tutorial` represents our folder's name where all our project files and dependencies will reside.
`--template` refers to the ethereum framework we want to use. In our case, `hardhat` for `solidity`.

Follow the prompts in the terminal for your project setup. 

After successful installations, you can remove all generated files that we don't need in this project by running the below command :

`cd dao-tutorial && rm -rf ./contracts/* && rm -rf ./deploy/erc20 && rm -rf ./deploy/nft && rm -rf ./test/*`

Lastly, open your `contracts` folder and create a new file `DAO.sol` inside it and paste the code below in the file.

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DAO is AccessControl,ReentrancyGuard {

    uint256 totalProposals;
    uint256 balance;
    address deployer;

    uint256 immutable STAKEHOLDER_MIN_CONTRIBUTION = 0.1 ether;
    uint256 immutable MIN_VOTE_PERIOD = 5 minutes;
    bytes32 private immutable COLLABORATOR_ROLE = keccak256("collaborator");
    bytes32 private immutable STAKEHOLDER_ROLE = keccak256("stakeholder");

    mapping(uint256 => Proposals) private raisedProposals;
    mapping(address => uint256[]) private stakeholderVotes;
    mapping(uint256 => Voted[]) private votedOn;
    mapping(address => uint256) private contributors;
    mapping(address => uint256) private stakeholders;

      struct Proposals {
        uint256 id;
        uint256 amount;
        uint256 upVote;
        uint256 downVotes;
        uint256 duration;
        string title;
        string description;
        bool paid;
        bool passed;
        address payable beneficiary;
        address propoper;
        address executor;
    }

     struct Voted {
        address voter;
        uint256 timestamp;
        bool chosen;
    }

     modifier stakeholderOnly(string memory message) {
        require(hasRole(STAKEHOLDER_ROLE,msg.sender),message);
        _;
    }
    modifier contributorOnly(string memory message){
        require(hasRole(COLLABORATOR_ROLE,msg.sender),message);
        _;
    }

    modifier onlyDeployer(string memory message) {
        require(msg.sender == deployer,message);

        _;
    }

     event ProposalAction(
        address indexed creator,
        bytes32 role,
        string message,
        address indexed beneficiary,
        uint256 amount
    );

     event VoteAction(
        address indexed creator,
        bytes32 role,
        string message,
        address indexed beneficiary,
        uint256 amount,
        uint256 upVote,
        uint256 downVotes,
        bool chosen
    );

     constructor(){
        deployer = msg.sender;
    }

       // proposal creation
    function createProposal (
        string calldata title,
        string calldata description,
        address beneficiary,
        uint256 amount
    )external stakeholderOnly("Only stakeholders are allowed to create Proposals") returns(Proposals memory){
        uint256 currentID = totalProposals++;
        Proposals storage StakeholderProposal = raisedProposals[currentID];
        StakeholderProposal.id = currentID;
        StakeholderProposal.amount = amount;
        StakeholderProposal.title = title;
        StakeholderProposal.description = description;
        StakeholderProposal.beneficiary = payable(beneficiary);
        StakeholderProposal.duration = block.timestamp + MIN_VOTE_PERIOD;

        emit ProposalAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            'Proposal Raised',
            beneficiary,
            amount
        );
        return StakeholderProposal;
    }

    
    // voting
    function performVote(uint256 proposalId,bool chosen) external
    stakeholderOnly("Only stakeholders can perform voting")
    returns(Voted memory)
    {
        Proposals storage StakeholderProposal = raisedProposals[proposalId];
        handleVoting(StakeholderProposal);
        if(chosen) StakeholderProposal.upVote++;
        else StakeholderProposal.downVotes++;

        stakeholderVotes[msg.sender].push(
            StakeholderProposal.id
        );
        votedOn[StakeholderProposal.id].push(
            Voted(
                msg.sender,
                block.timestamp,
                chosen
            )
        );

        emit VoteAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PROPOSAL VOTE",
            StakeholderProposal.beneficiary,
            StakeholderProposal.amount,
            StakeholderProposal.upVote,
            StakeholderProposal.downVotes,
            chosen
        );

        return Voted(
            msg.sender,
            block.timestamp,
            chosen
        );

    }

    // handling vote
    function handleVoting(Proposals storage proposal) private {
        if (proposal.passed || proposal.duration <= block.timestamp) {
            proposal.passed = true;
            revert("Time has already passed");
        }
        uint256[] memory tempVotes = stakeholderVotes[msg.sender];
        for (uint256 vote = 0; vote < tempVotes.length; vote++) {
            if (proposal.id == tempVotes[vote])
                revert("double voting is not allowed");
        }

    }

     // pay beneficiary
    function payBeneficiary(uint proposalId) external
    stakeholderOnly("Only stakeholders can make payment") onlyDeployer("Only deployer can make payment") nonReentrant() returns(uint256){
        Proposals storage stakeholderProposal = raisedProposals[proposalId];
        require(balance >= stakeholderProposal.amount, "insufficient fund");
        if(stakeholderProposal.paid == true) revert("payment already made");
        if(stakeholderProposal.upVote <= stakeholderProposal.downVotes) revert("insufficient votes");

        pay(stakeholderProposal.amount,stakeholderProposal.beneficiary);
        stakeholderProposal.paid = true;
        stakeholderProposal.executor = msg.sender;
        balance -= stakeholderProposal.amount;

        emit ProposalAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PAYMENT SUCCESSFULLY MADE!",
            stakeholderProposal.beneficiary,
            stakeholderProposal.amount
        );

        return balance;

    }

    // paymment functionality
    function pay(uint256 amount,address to) internal returns(bool){
        (bool success,) = payable(to).call{value : amount}("");
        require(success, "payment failed");
        return true;
    }

      // contribution functionality
    function contribute() payable external returns(uint256){
        require(msg.value > 0 ether, "invalid amount");
        if (!hasRole(STAKEHOLDER_ROLE, msg.sender)) {
            uint256 totalContributions = contributors[msg.sender] + msg.value;

            if (totalContributions >= STAKEHOLDER_MIN_CONTRIBUTION) {
                stakeholders[msg.sender] = msg.value;
                contributors[msg.sender] += msg.value;
                 _grantRole(STAKEHOLDER_ROLE,msg.sender);
                 _grantRole(COLLABORATOR_ROLE, msg.sender);
            }
            else {
                contributors[msg.sender] += msg.value;
                 _grantRole(COLLABORATOR_ROLE,msg.sender);
            }
        }
        else{
            stakeholders[msg.sender] += msg.value;
            contributors[msg.sender] += msg.value;
        }

        balance += msg.value;
        emit ProposalAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            "CONTRIBUTION SUCCESSFULLY RECEIVED!",
            address(this),
            msg.value
        );


        return balance;
    }

        // get single proposal
    function getProposals(uint256 proposalID) external view returns(Proposals memory) {
        return raisedProposals[proposalID];
    }

    // get all proposals
    function getAllProposals() external view returns(Proposals[] memory props){
        props = new Proposals[](totalProposals);
        for (uint i = 0; i < totalProposals; i++) {
            props[i] = raisedProposals[i];
        }

    }

    // get a specific proposal votes
    function getProposalVote(uint256 proposalID) external view returns(Voted[] memory){
        return votedOn[proposalID];
    }

    // get stakeholders votes
    function getStakeholdersVotes() stakeholderOnly("Unauthorized") external view returns(uint256[] memory){
        return stakeholderVotes[msg.sender];
    }

    // get stakeholders balances
    function getStakeholdersBalances() stakeholderOnly("unauthorized") external view returns(uint256){
        return stakeholders[msg.sender];

    }

     // get total balances
    function getTotalBalance() external view returns(uint256){
        return balance;

    }

    // check if stakeholder
    function stakeholderStatus() external view returns(bool){
        return stakeholders[msg.sender] > 0;
    }

    // check if contributor
    function isContributor() external view returns(bool){
        return contributors[msg.sender] > 0;
    }

    // check contributors balance
    function getContributorsBalance() contributorOnly("unathorized") external view returns(uint256){
        return contributors[msg.sender];
    }

    function getDeployer()external view returns(address){
        return deployer;

    }

}
```


## Section 3: Code Explanation of the Smart Contracts

### 3.1 The Control of Roles and Access

Utilize OpenZeppelin's AccessControl package, providing role-based access control for secure interactions with collaborators and stakeholders.

```solidity
  import "@openzeppelin/contracts/access/AccessControl.sol";
  import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

### 3.2 Formulation of Proposals

this function allows stakeholders to create proposals by providing essential details such as `title` `description`, `beneficiary`, and `amount`. The function ensures that only `stakeholders` can initiate proposals, and it emits an event to notify external applications about the proposal creation.

```solidity
  function createProposal (
        string calldata title,
        string calldata description,
        address beneficiary,
        uint256 amount
    )external stakeholderOnly("Only stakeholders are allowed to create Proposals") returns(Proposals memory){
        uint256 currentID = totalProposals++;
        Proposals storage StakeholderProposal = raisedProposals[currentID];
        StakeholderProposal.id = currentID;
        StakeholderProposal.amount = amount;
        StakeholderProposal.title = title;
        StakeholderProposal.description = description;
        StakeholderProposal.beneficiary = payable(beneficiary);
        StakeholderProposal.duration = block.timestamp + MIN_VOTE_PERIOD;

        emit ProposalAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            'Proposal Raised',
            beneficiary,
            amount
        );
        return StakeholderProposal;
    }

```

## Section 4: Involvement of Stakeholders

### 4.1 Supporting the DAO

this function allows contributors to send Ether to the contract. If the contributor is not a stakeholder, it checks whether their total contributions meet the minimum requirement. If so, the contributor becomes a stakeholder and collaborator; otherwise, they become a collaborator only.
```solidity
    function contribute() payable external returns(uint256){
        require(msg.value > 0 ether, "invalid amount");
        if (!hasRole(STAKEHOLDER_ROLE, msg.sender)) {
            uint256 totalContributions = contributors[msg.sender] + msg.value;

            if (totalContributions >= STAKEHOLDER_MIN_CONTRIBUTION) {
                stakeholders[msg.sender] = msg.value;
                contributors[msg.sender] += msg.value;
                 _grantRole(STAKEHOLDER_ROLE,msg.sender);
                 _grantRole(COLLABORATOR_ROLE, msg.sender);
            }
            else {
                contributors[msg.sender] += msg.value;
                 _grantRole(COLLABORATOR_ROLE,msg.sender);
            }
        }
        else{
            stakeholders[msg.sender] += msg.value;
            contributors[msg.sender] += msg.value;
        }

        balance += msg.value;
        emit ProposalAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            "CONTRIBUTION SUCCESSFULLY RECEIVED!",
            address(this),
            msg.value
        );


        return balance;
    }
```

### 4.2 The Voting Process

this function facilitates the voting process for stakeholders, updating proposal details, 
recording votes, and emitting an event to notify external applications about the voting action.
```solidity
 function performVote(uint256 proposalId,bool chosen) external
    stakeholderOnly("Only stakeholders can perform voting")
    returns(Voted memory)
    {
        Proposals storage StakeholderProposal = raisedProposals[proposalId];
        handleVoting(StakeholderProposal);
        if(chosen) StakeholderProposal.upVote++;
        else StakeholderProposal.downVotes++;

        stakeholderVotes[msg.sender].push(
            StakeholderProposal.id
        );
        votedOn[StakeholderProposal.id].push(
            Voted(
                msg.sender,
                block.timestamp,
                chosen
            )
        );

        emit VoteAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PROPOSAL VOTE",
            StakeholderProposal.beneficiary,
            StakeholderProposal.amount,
            StakeholderProposal.upVote,
            StakeholderProposal.downVotes,
            chosen
        );

        return Voted(
            msg.sender,
            block.timestamp,
            chosen
        );

    }
```
## Section 5: Proposal Execution and Payments

### 5.1 Payment Logic

this function ensures the necessary conditions are met before making a payment to the beneficiary of a proposal. It records the payment details, updates the contract's balance, and emits an event to inform external applications about the successful payment action.
```solidity

    function payBeneficiary(uint proposalId) external
    stakeholderOnly("Only stakeholders can make payment") onlyDeployer("Only deployer can make payment") nonReentrant() returns(uint256){
        Proposals storage stakeholderProposal = raisedProposals[proposalId];
        require(balance >= stakeholderProposal.amount, "insufficient fund");
        if(stakeholderProposal.paid == true) revert("payment already made");
        if(stakeholderProposal.upVote <= stakeholderProposal.downVotes) revert("insufficient votes");

        pay(stakeholderProposal.amount,stakeholderProposal.beneficiary);
        stakeholderProposal.paid = true;
        stakeholderProposal.executor = msg.sender;
        balance -= stakeholderProposal.amount;

        emit ProposalAction(
            msg.sender,
            STAKEHOLDER_ROLE,
            "PAYMENT SUCCESSFULLY MADE!",
            stakeholderProposal.beneficiary,
            stakeholderProposal.amount
        );

        return balance;

    }
```
### 5.2 Single proposal

this function retrieves single proposal using `proposalID`
```solidity
 function getProposals(uint256 proposalID) external view returns(Proposals memory) {
        return raisedProposals[proposalID];
    }
```
### 5.3 All proposals

this function retrieves all proposals
```solidity
 function getAllProposals() external view returns(Proposals[] memory props){
        props = new Proposals[](totalProposals);
        for (uint i = 0; i < totalProposals; i++) {
            props[i] = raisedProposals[i];
        }

    }
```
### 5.4 Proposal Votes

this function retrieves proposal votes
```solidity
  function getProposalVote(uint256 proposalID) external view returns(Voted[] memory){
        return votedOn[proposalID];
    }
```
## Section 6: Stakeholders and Contributors

### 6.1 Stakeholder Votes

this function retrieves stakeholder votes
```solidity
function getStakeholdersVotes() stakeholderOnly("Unauthorized") external view returns(uint256[] memory){
        return stakeholderVotes[msg.sender];
    }   
```
### 6.2 Stakeholder Balance

this function retrieves stakeholder balance
```solidity
 function getStakeholdersBalances() stakeholderOnly("unauthorized") external view returns(uint256){
        return stakeholders[msg.sender];

    }
```
### 6.3 DAO Total Balance

this function retrieves the balance of the DAO
```solidity
 function getTotalBalance() external view returns(uint256){
        return balance;

    }
```
### 6.4 Stakeholder Status

this function checks stakeholder status
```solidity
 function stakeholderStatus() external view returns(bool){
        return stakeholders[msg.sender] > 0;
    }

```
### 6.5 Contributor Status

this function checks the contributor status
```solidity
 function isContributor() external view returns(bool){
        return contributors[msg.sender] > 0;
    }
```
### 6.6 Contributor Balance

this function retrieves the contributor's balance
```solidity
function getContributorsBalance() contributorOnly("unathorized") external view returns(uint256){
        return contributors[msg.sender];
    }
```
### 6.7 Deployer Address

this function returns the deployer address
```solidity
function getDeployer()external view returns(address){
        return deployer;

    }
```

## Section 7: Compile and Deploy

Run `npm run compile` to compile your smart contract. If it is compiled successfully, your terminal should produce a result like below
![compile](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/4d95b1c7-b2a8-412e-8448-0f975de27a0c)

Now, let's go ahead and deploy our smart contract. Two things should be in place before you run your deployment script.
The first thing is `.env`, your private key should be already set and the second thing is that your account should hold some faucets to deploy to the zkSync sepolia testnet.

Next, replace `deploy.ts` in your `deploy` folder with the following code.

```typescript
import { deployContract } from "./utils";

// An example of a basic deploy script
// It will deploy a Greeter contract to selected network
// as well as verify it on Block Explorer if possible for the network
export default async function () {
  const contractArtifactName = "DAO";
  const constructorArguments = [];
  await deployContract(contractArtifactName, constructorArguments);
}

```

Finally, run `npm run deploy` to deploy your contract. You should see a similar result below if it is deployed successfully.
![4w-social-env](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/d213bad0-bb26-4768-86af-996a9ace6e2d)


Congratulations!