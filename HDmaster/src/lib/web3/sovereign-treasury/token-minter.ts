import { Interface } from 'ethers';

export interface MintPayload {
    to: string;
    data: string;
}

export class TokenMinter {
    private tokenInterface: Interface;

    constructor() {
        this.tokenInterface = new Interface([
            "function mint(address to, uint256 amount)"
        ]);
    }

    /**
     * Constructs the raw transaction data payload to mint new KingPay loyalty tokens.
     */
    public constructMintTransaction(contractAddress: string, toAddress: string, amount: bigint): MintPayload {
        const data = this.tokenInterface.encodeFunctionData("mint", [toAddress, amount]);
        return {
            to: contractAddress,
            data
        };
    }
}
