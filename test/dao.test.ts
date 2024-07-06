import { expect,assert } from 'chai';
import { Contract, Wallet } from "zksync-ethers";
import { getWallet, deployContract, LOCAL_RICH_WALLETS } from '../deploy/utils';
import * as ethers from "ethers";

describe("DAO",()=>{
    let DAO : Contract
    let stakeholder : Wallet
    let contributor : Wallet
    let deployer : Wallet
    let beneficiary : Wallet

    beforeEach(async ()=>{
        stakeholder = getWallet(LOCAL_RICH_WALLETS[0].privateKey);
        contributor = getWallet(LOCAL_RICH_WALLETS[1].privateKey);
        deployer = getWallet(LOCAL_RICH_WALLETS[2].privateKey);
        beneficiary = getWallet(LOCAL_RICH_WALLETS[3].privateKey);
        
        DAO = await deployContract("DAO", [], { wallet: deployer, silent: true });
    })

    describe("stakeholders and contributors", ()=>{
        it("stakeholder contributes and retrieves balance", async()=>{
            let price = ethers.parseEther('1');
            await (DAO.connect(stakeholder) as Contract).contribute({value:price})
            let balance = await (DAO.connect(stakeholder) as Contract).getStakeholdersBalances();
            assert.equal(balance,price.toString())
        })

        it("collaborator contributes and retrieves balance", async()=>{
            let price = ethers.parseEther('0.05');
            await (DAO.connect(contributor) as Contract).contribute({value:price})
            let balance = await (DAO.connect(contributor) as Contract).getContributorsBalance();
            assert.equal(balance,price.toString())
        })

        it("checks stakeholder status", async()=>{
            let price = ethers.parseEther('1');
            await (DAO.connect(stakeholder) as Contract).contribute({value:price})
            let stakeholderStatus = await (DAO.connect(stakeholder) as Contract).stakeholderStatus()
            assert.equal(stakeholderStatus,true)
        })

        it("checks contributors status", async()=>{
            let price = ethers.parseEther('0.05');
            await (DAO.connect(contributor) as Contract).contribute({value:price})
            let contributorStatus = await (DAO.connect(contributor) as Contract).isContributor()
            assert.equal(contributorStatus,true)
        })
    })
    


    describe("proposal", ()=>{
        it("creates proposal", async () => {
            let amount = ethers.parseEther('1');
            await (DAO.connect(stakeholder) as Contract).contribute({value:amount})
            let proposalTx = await (DAO.connect(stakeholder) as Contract)
            .createProposal('title', 'desc', beneficiary.address, amount);
            
            const receipt = await proposalTx.wait();
            const event = receipt.logs.find((log:any) => {
                const parsedLog = DAO.interface.parseLog(log);
                return parsedLog?.name === 'ProposalAction';
            });

            assert.equal(event.args[2], 'Proposal Raised');
            assert.equal(event.args[3], beneficiary.address);
            assert.equal(event.args[4], amount.toString());
        });

        it("retrieves proposal", async ()=>{
            let amount = ethers.parseEther('1');
            await (DAO.connect(stakeholder) as Contract).contribute({value:amount})
            await (DAO.connect(stakeholder) as Contract)
            .createProposal('title', 'desc', beneficiary.address, amount);
            let firstProposal = await DAO.getProposals(0)
            expect(firstProposal.id.toString()).to.equal('0')
            expect(firstProposal.title).to.equal('title');
            expect(firstProposal.description).to.equal('desc');
            expect(firstProposal.beneficiary).to.equal(beneficiary.address);
            expect(firstProposal.amount.toString()).to.equal(amount.toString());
        })

    })

    describe("voting and payment",()=>{
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
            const event = receipt.logs.find((log:any) => {
                const parsedLog = DAO.interface.parseLog(log);
                return parsedLog?.name === 'VoteAction';
            });
        
            // Assertions to check the event details
            expect(event.args[7]).to.equal(true);
            expect(event.args[4].toString()).to.equal(amount.toString());
            expect(event.args[3]).to.equal(beneficiary.address);
        });

        it("performs downvote", async()=>{
            let price = ethers.parseEther('0.5');
            let amount = ethers.parseEther('4');
            // Stakeholder contributes to the DAO
            await (DAO.connect(stakeholder) as Contract).
            contribute({ value: price });
             // Stakeholder creates a proposal
            await (DAO.connect(stakeholder) as Contract).
            createProposal('title', 'desc', beneficiary.address, amount);
            let voteTx = await (DAO.connect(stakeholder) as Contract).performVote(0,false)
            // Wait for the transaction to be mined and get the receipt
            const receipt = await voteTx.wait();
            const events = receipt.logs.find((log:any) => {
                const parsedLog = DAO.interface.parseLog(log);
                return parsedLog?.name === 'VoteAction';
            });
    
            expect(events.args[7]).to.equal(false)
            expect(events.args[4]).to.equal(amount)
            expect(events.args[3]).to.equal(beneficiary.address)
        })
        
        it("retrieves proposal vote", async ()=>{
            let price = ethers.parseEther('0.5');
            let amount = ethers.parseEther('4');
            await (DAO.connect(stakeholder) as Contract).contribute({value:price})
            await (DAO.connect(stakeholder) as Contract).createProposal('title','desc',beneficiary.address,amount)
            await (DAO.connect(stakeholder) as Contract).performVote(0,true)
            let vote =  await DAO.getProposalVote(0)
            assert.equal(vote[0].voter,stakeholder.address)
        })

        it("pays beneficiary", async()=>{
            let previousBalance, currentBalance
            let price = ethers.parseEther('0.5');
            let amount = ethers.parseEther('0.02');
            await (DAO.connect(deployer) as Contract).contribute({value:price})
            await (DAO.connect(deployer) as Contract).createProposal('title','desc',beneficiary.address,amount)
            await (DAO.connect(deployer) as Contract).performVote(0,true)
            await DAO.getTotalBalance().then((result)=>{
            previousBalance = result
            })
            const processPayment = await (DAO.connect(deployer) as Contract).payBeneficiary(0)
            const receipt = await processPayment.wait()
            const events = receipt.logs.find((log:any) => {
                const parsedLog = DAO.interface.parseLog(log);
                return parsedLog?.name === 'ProposalAction';
            });
    
            assert.equal(events.args[3],beneficiary.address)
            await DAO.getTotalBalance().then((result)=>{
                currentBalance = result
            })
           assert.equal(previousBalance,price)
           assert.equal(currentBalance,ethers.parseEther('0.48'))
    
            
        })
    })

    
    
})