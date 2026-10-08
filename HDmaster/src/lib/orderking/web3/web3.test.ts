import { test } from 'node:test';
import assert from 'node:assert';
import { ethers } from 'ethers';
import { Web3WalletManager } from './wallet-manager';
import { SmartContractExecutor } from './smart-contract-executor';
import { DeFiTreasury } from './treasury';

test('Web3WalletManager should generate and recover wallet', () => {
  const manager = new Web3WalletManager();
  const wallet = manager.generateWallet();
  
  assert.ok(wallet.address.startsWith('0x'));
  assert.ok(wallet.mnemonic);
  
  const recovered = manager.recoverWallet(wallet.mnemonic!);
  assert.strictEqual(recovered.address, wallet.address);
  assert.strictEqual(recovered.privateKey, wallet.privateKey);
});

test('SmartContractExecutor should simulate transaction offline', async () => {
  const executor = new SmartContractExecutor();
  const abi = [
    "function transfer(address to, uint amount) returns (bool)"
  ];
  const manager = new Web3WalletManager();
  const wallet = manager.generateWallet();
  
  const toAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const amount = ethers.parseEther("1.0");
  
  const result = await executor.simulateTransaction(
    "0x0000000000000000000000000000000000000000",
    abi,
    "transfer",
    [toAddress, amount],
    wallet.privateKey
  );
  
  assert.strictEqual(result.simulated, true);
  assert.ok(result.signedTx.startsWith('0x'));
  assert.ok(result.txHash.startsWith('0x'));
});

test('DeFiTreasury should manage balances and multi-sig approvals', () => {
  const treasury = new DeFiTreasury();
  treasury.updateBalance('ETH', 100n);
  assert.strictEqual(treasury.getBalance('ETH'), 100n);
  
  treasury.requestApproval('req1', 50n, 'ETH', '0x123');
  treasury.approveRequest('req1', 'founder1', 2);
  
  const reqIntermediate = treasury.approveRequest('req1', 'founder1', 2); 
  assert.strictEqual(reqIntermediate.status, 'PENDING'); // Duplicate approval shouldn't advance state
  
  const reqFinal = treasury.approveRequest('req1', 'founder2', 2);
  assert.strictEqual(reqFinal.status, 'APPROVED');
  assert.strictEqual(treasury.getBalance('ETH'), 50n); // Deducted
});
