import { Contract, Provider, Signer, Interface, InterfaceAbi } from 'ethers';

export interface ERC20TransferOptions {
    to: string;
    amount: bigint;
}

export interface OwnershipTransferOptions {
    newOwner: string;
}

export class SmartContractManager {
    private providerOrSigner: Provider | Signer;

    constructor(providerOrSigner: Provider | Signer) {
        this.providerOrSigner = providerOrSigner;
    }

    public getContract(address: string, abi: Interface | InterfaceAbi | string[]): Contract {
        return new Contract(address, abi, this.providerOrSigner);
    }
    
    public async transferERC20(contractAddress: string, options: ERC20TransferOptions): Promise<any> {
        const abi = [
            "function transfer(address to, uint256 amount) returns (bool)"
        ];
        const contract = this.getContract(contractAddress, abi);
        return contract.transfer(options.to, options.amount);
    }

    public async transferOwnership(contractAddress: string, options: OwnershipTransferOptions): Promise<any> {
        const abi = [
            "function transferOwnership(address newOwner)"
        ];
        const contract = this.getContract(contractAddress, abi);
        return contract.transferOwnership(options.newOwner);
    }
}
