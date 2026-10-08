import { ethers } from 'ethers';

/**
 * Deploys a Treasury smart contract.
 * @param abi The ABI of the contract.
 * @param bytecode The compiled bytecode of the contract.
 * @param initialAdmin The address of the initial admin of the treasury.
 * @returns The address of the deployed contract.
 */
export async function deployTreasuryContract(abi: any[], bytecode: string, initialAdmin: string): Promise<string> {
    const providerUrl = process.env.RPC_URL;
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!providerUrl) {
        throw new Error("RPC_URL environment variable is not set.");
    }
    if (!privateKey) {
        throw new Error("DEPLOYER_PRIVATE_KEY environment variable is not set.");
    }

    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    console.log("Deploying Treasury contract...");
    
    // Deploy the contract, passing the initialAdmin argument to the constructor
    const contract = await factory.deploy(initialAdmin);
    
    // Wait for the deployment transaction to be mined
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log(`Treasury contract deployed at address: ${contractAddress}`);

    return contractAddress;
}
