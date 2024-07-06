import { ethers } from 'ethers';
import DAO_ABI from './DAO_ABI.json'; // Import the ABI of your DAO contract

const DAO_ADDRESS = '0xE58b25b065822187cA39FB063983aE8Ba67DD3F1'; // Replace with your DAO contract address

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