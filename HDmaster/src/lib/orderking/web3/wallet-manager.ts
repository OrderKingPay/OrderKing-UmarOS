import { ethers } from 'ethers';

export class Web3WalletManager {
  /**
   * Generates a new HD wallet.
   * Returns the mnemonic, private key, and the primary address.
   */
  generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase
    };
  }

  /**
   * Recovers a wallet from a mnemonic phrase.
   */
  recoverWallet(mnemonic: string) {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }
}
