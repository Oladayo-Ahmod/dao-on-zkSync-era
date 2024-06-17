
![zkSync](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/b616b748-2af6-4e66-8150-ef55514eb127)

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
- [Section 7: Writing Tests](#section-7-writing-tests)
- [Section 8: Compile and Deploy](#section-6-compile-and-deploy)
- [Section 9 Frontend Integration with Next.js](#section-9-frontend-integration-with-nextjs)

  
 
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

```solidity
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

### Section 7: Writing Tests

Next, let's proceed to writning tests for the DAO contract.

First, let's import the packages needed to run the tests.

```typescript
import { expect,assert } from 'chai';
import { Contract, Wallet } from "zksync-ethers";
import { getWallet, deployContract, LOCAL_RICH_WALLETS } from '../deploy/utils';
import * as ethers from "ethers";

```

The tests are organized into several categories:

- **Stakeholders and Contributors**: Tests related to contributions and balances of stakeholders and contributors.
- **Proposals**: Tests for creating and retrieving proposals.
- **Voting**: Tests for performing upvotes and downvotes, and retrieving proposal votes.
- **Payments**: Test for paying the beneficiary.


### Stakeholders and Contributors

1. **Stakeholder Contributes and Retrieves Balance**:

   Tests if a stakeholder can contribute to the DAO and retrieve their balance.

   ```js
   it("stakeholder contributes and retrieves balance", async () => {
       let price = ethers.parseEther('1');
       await (DAO.connect(stakeholder) as Contract).contribute({ value: price });
       let balance = await (DAO.connect(stakeholder) as Contract).getStakeholdersBalances();
       assert.equal(balance, price.toString());
   });
   ```

2. **Contributor Contributes and Retrieves Balance**:

   Tests if a contributor can contribute to the DAO and retrieve their balance.

   ```js
   it("collaborator contributes and retrieves balance", async () => {
       let price = ethers.parseEther('0.05');
       await (DAO.connect(contributor) as Contract).contribute({ value: price });
       let balance = await (DAO.connect(contributor) as Contract).getContributorsBalance();
       assert.equal(balance, price.toString());
   });
   ```

3. **Check Stakeholder Status**:

   Tests if a stakeholder status can be checked.

   ```js
   it("checks stakeholder status", async () => {
       let price = ethers.parseEther('1');
       await (DAO.connect(stakeholder) as Contract).contribute({ value: price });
       let stakeholderStatus = await (DAO.connect(stakeholder) as Contract).stakeholderStatus();
       assert.equal(stakeholderStatus, true);
   });
   ```

4. **Check Contributor Status**:

   Tests if a contributor status can be checked.

   ```js
   it("checks contributors status", async () => {
       let price = ethers.parseEther('0.05');
       await (DAO.connect(contributor) as Contract).contribute({ value: price });
       let contributorStatus = await (DAO.connect(contributor) as Contract).isContributor();
       assert.equal(contributorStatus, true);
   });
   ```

### Proposals

1. **Create Proposal**:

   Tests if a proposal can be created.

   ```js
   it("creates proposal", async () => {
       let amount = ethers.parseEther('1');
       await (DAO.connect(stakeholder) as Contract).contribute({ value: amount });
       let proposalTx = await (DAO.connect(stakeholder) as Contract).createProposal('title', 'desc', beneficiary.address, amount);
       
       const receipt = await proposalTx.wait();
       const event = receipt.logs.find((log) => {
           const parsedLog = DAO.interface.parseLog(log);
           return parsedLog?.name === 'ProposalAction';
       });

       assert.equal(event.args[2], 'Proposal Raised');
       assert.equal(event.args[3], beneficiary.address);
       assert.equal(event.args[4], amount.toString());
   });
   ```

2. **Retrieve Proposal**:

   Tests if a proposal can be retrieved.

   ```js
   it("retrieves proposal", async () => {
       let amount = ethers.parseEther('1');
       await (DAO.connect(stakeholder) as Contract).contribute({ value: amount });
       await (DAO.connect(stakeholder) as Contract).createProposal('title', 'desc', beneficiary.address, amount);
       let firstProposal = await DAO.getProposals(0);
       expect(firstProposal.id.toString()).to.equal('0');
       expect(firstProposal.title).to.equal('title');
       expect(firstProposal.description).to.equal('desc');
       expect(firstProposal.beneficiary).to.equal(beneficiary.address);
       expect(firstProposal.amount.toString()).to.equal(amount.toString());
   });
   ```

### Voting

1. **Perform Upvote**:

   Tests if a stakeholder can upvote a proposal.

   ```js
   it("performs upvote", async () => {
       let price = ethers.parseEther('0.5');
       let amount = ethers.parseEther('4');
       
       // Stakeholder contributes to the DAO
       await (DAO.connect(stakeholder) as Contract).contribute({ value: price });
       
       // Stakeholder creates a proposal
       await (DAO.connect(stakeholder) as Contract).createProposal('title', 'desc', beneficiary.address, amount);
       
       // Stakeholder performs an upvote on the proposal
       let voteTx = await (DAO.connect(stakeholder) as Contract).performVote(0, true);
       
       // Wait for the transaction to be mined and get the receipt
       const receipt = await voteTx.wait();
       
       // Find the 'VoteAction' event in the logs
       const event = receipt.logs.find((log) => {
           const parsedLog = DAO.interface.parseLog(log);
           return parsedLog?.name === 'VoteAction';
       });
   
       // Assertions to check the event details
       expect(event.args[7]).to.equal(true);
       expect(event.args[4].toString()).to.equal(amount.toString());
       expect(event.args[3]).to.equal(beneficiary.address);
   });
   ```

2. **Perform Downvote**:

   Tests if a stakeholder can downvote a proposal.

   ```js
   it("performs downvote", async () => {
       let price = ethers.parseEther('0.5');
       let amount = ethers.parseEther('4');
       
       // Stakeholder contributes to the DAO
       await (DAO.connect(stakeholder) as Contract).contribute({ value: price });
       
       // Stakeholder creates a proposal
       await (DAO.connect(stakeholder) as Contract).createProposal('title', 'desc', beneficiary.address, amount);
       
       // Stakeholder performs a downvote on the proposal
       let voteTx = await (DAO.connect(stakeholder) as Contract).performVote(0, false);
       
       // Wait for the transaction to be mined and get the receipt
       const receipt = await voteTx.wait();
       
       // Find the 'VoteAction' event in the logs
       const event = receipt.logs.find((log) => {
           const parsedLog = DAO.interface.parseLog(log);
           return parsedLog?.name === 'VoteAction';
       });

       expect(event.args[7]).to.equal(false);
       expect(event.args[4].toString()).to.equal(amount.toString());
       expect(event.args[3]).to.equal(beneficiary.address);
   });
   ```

3. **Retrieve Proposal Vote**:

   Tests if a vote on a proposal can be retrieved.

   ```js
   it("retrieves proposal vote", async () => {
       let price = ethers.parseEther('0.5');
       let amount = ethers.parseEther('4');
       await (DAO.connect(stakeholder) as Contract).contribute({ value: price });
       await (DAO.connect(stakeholder) as Contract).createProposal('title', 'desc', beneficiary.address, amount);
       await (DAO.connect(stakeholder) as Contract).performVote(0, true);
       let vote = await DAO.getProposalVote(0);
       assert.equal(vote[0].voter, stakeholder.address);
   });
   ```

### Payments

1. **Pay Beneficiary**:

   Tests if the beneficiary is paid correctly.

   ```js
   it("pays beneficiary", async () => {
       let previousBalance, currentBalance;
       let price = ethers.parseEther('0.5');
       let amount = ethers.parseEther('0.02');
       
       await (DAO.connect(deployer) as Contract).contribute({ value: price });
       await (DAO.connect(deployer) as Contract).createProposal('title', 'desc', beneficiary.address, amount);
       await (DAO.connect(deployer) as Contract).performVote(0, true);
       previousBalance = await DAO.getTotalBalance();
       const processPaymentTx = await (DAO.connect(deployer) as Contract).payBeneficiary(0);
       const receipt = await processPaymentTx.wait();
       const event = receipt.logs.find((log) => {
           const parsedLog = DAO.interface.parseLog(log);
           return parsedLog?.name === 'ProposalAction';
       });

       assert.equal(event.args[3], beneficiary.address);
       currentBalance = await DAO.getTotalBalance();
       assert.equal(previousBalance.toString(), price.toString());
       assert.equal(currentBalance.toString(), ethers.parseEther('0.48').toString());
   });
   ```

Finally, let's run the tests by running the below commands in the terminal:

`npm run test`

If the tests are successful, you should see a similar result to the one below where all test cases passed.
![final-tests](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/9926f917-909a-4f68-90f9-972331ab1ca4)

## Section 8: Compile and Deploy

Run `npm run compile` to compile your smart contract. If it is compiled successfully, your terminal should produce a result like below
![compile](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/8d316e21-38b4-453e-ae9e-40f005051924)

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
![deploy](https://github.com/Oladayo-Ahmod/dao-on-zkSync-era/assets/57647734/7d50ba77-8544-4cdd-95aa-23220f948e9e)


## Section 9 Frontend Integration with Next.js

This section provides a step-by-step guide to integrate the DAO contract with a Next.js frontend.

### Setting Up the Next.js Project

1. Create a new Next.js project:

   ```sh
   npx create-next-app@latest dao-frontend
   cd dao-frontend
   ```

2. Install necessary dependencies:

   ```sh
   npm install ethers
   ```

### Integrating the DAO Contract

1. Create a new file `utils/dao.js` to set up the DAO contract interaction :

   ```js
   import { ethers } from 'ethers';
   import DAO_ABI from './DAO_ABI.json'; // Import the ABI of your DAO contract

   const DAO_ADDRESS = 'YOUR_DAO_CONTRACT_ADDRESS'; // Replace with your DAO contract address

   export const getDAOContract = () => {
       if (typeof window.ethereum !== 'undefined') {
           const provider = new ethers.BrowserProvider(window.ethereum);
           const signer = provider.getSigner();
           const contract = new ethers.Contract(DAO_ADDRESS, DAO_ABI, signer);
           return contract;
       } else {
           console.error('Ethereum wallet is not available');
           return null;
       }
   };
   ```

2. Create a new file `pages/index.js` for the main interface:

   ```jsx
   import { useEffect, useState } from 'react';
   import { ethers } from 'ethers';
   import { getDAOContract } from '../utils/dao';

   export default function Home() {
       const [stakeholder, setStakeholder] = useState(null);
       const [contributor, setContributor] = useState(null);
       const [balance, setBalance] = useState('0');

       useEffect(() => {
           const loadBlockchainData = async () => {
               const daoContract = getDAOContract();
               if (daoContract) {
                   const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                   const balance = await daoContract.getStakeholdersBalances();
                   setStakeholder(accounts[0]);
                   setBalance(ethers.formatEther(balance));
               }
           };
           loadBlockchainData();
       }, []);

       const handleContribute = async (amount) => {
           const daoContract = getDAOContract();
           if (daoContract) {
               const tx = await daoContract.contribute({ value: ethers.parseEther(amount) });
               await tx.wait();
               const balance = await daoContract.getStakeholdersBalances();
               setBalance(ethers.formatEther(balance));
           }
       };

       return (
           <div>
               <h1>DAO Interface</h1>
               <p>Stakeholder: {stakeholder}</p>
               <p>Balance: {balance} ETH</p>
               <button onClick={() => handleContribute('1')}>Contribute 1 ETH</button>
           </div>
       );
   }
   ```

3. Create the `DAO_ABI.json` file in the `utils` directory, and paste the ABI of your DAO contract into it.

### Running the Next.js Application

1. Start the Next.js development server:

   ```sh
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000` to interact with the DAO contract through the frontend interface.


Congratulations! You have the made it to the end of the DAO tutorial, Smart contract, Testing, Deployment and Frontend Integration.
