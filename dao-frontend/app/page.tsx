"use client";

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getDAOContract } from '../utils/dao';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  const [stakeholder, setStakeholder] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [daoBalance, setDaoBalance] = useState<string>('0');
  const [stakeholderStatus, setStakeholderStatus] = useState(false);
  const [contributorStatus, setContributorStatus] = useState(false);
  const [contributeAmount, setContributeAmount] = useState<string>('0');

  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        const daoContract = getDAOContract();
        if (daoContract && typeof window !== 'undefined') {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          const balance = await daoContract.getStakeholdersBalances();
          const daoTotalBalance = await daoContract.getTotalBalance();
          const isStakeholder = await daoContract.stakeholderStatus();
          const isContributor = await daoContract.isContributor();

          setStakeholder(accounts[0]);
          setBalance(ethers.formatEther(balance));
          setDaoBalance(ethers.formatEther(daoTotalBalance));
          setStakeholderStatus(isStakeholder);
          setContributorStatus(isContributor);
        }
      } catch (error) {
        console.error("Error loading blockchain data", error);
      }
    };
    loadBlockchainData();
  }, []);

  const handleContribute = async () => {
    try {
      const daoContract = getDAOContract();
      if (daoContract && contributeAmount) {
        const tx = await daoContract.contribute({ value: ethers.parseEther(contributeAmount) });
        await tx.wait();
        const balance = await daoContract.getStakeholdersBalances();
        setBalance(ethers.formatEther(balance));
      }
    } catch (error) {
      console.error("Error contributing", error);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column align-items-center justify-content-center">
      <h1 className="mb-5">DAO Interface</h1>
      <div className="card shadow p-4" style={{ width: '400px' }}>
        <div className="card-body">
          <h5 className="card-title">Stakeholder</h5>
          <p className="card-text">{stakeholder}</p>
          <h5 className="card-title">Balance</h5>
          <p className="card-text">{balance} ETH</p>
          <h5 className="card-title">Total DAO Balance</h5>
          <p className="card-text">{daoBalance} ETH</p>
          <h5 className="card-title">Status</h5>
          <p className="card-text">
            {stakeholderStatus ? 'Stakeholder' : contributorStatus ? 'Contributor' : 'New User'}
          </p>
          <div className="input-group mb-3">
            <input
              type="number"
              className="form-control"
              placeholder="Contribute min 0.1ETH to be a stakeholder"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleContribute}>Contribute</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
