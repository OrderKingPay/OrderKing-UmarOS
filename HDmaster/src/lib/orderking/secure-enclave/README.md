# Secure Enclave: Cryptographic Sharding

This module implements Shamir's Secret Sharing (SSS) to cryptographically shard the Founder's Master Key. 

## Requirements Addressed
- **Cryptographic Sharding:** The Master Key is split into $N$ shares, requiring $M$ shares to reconstruct.
- **Memory Safety:** The Master Key cannot reside in plain text memory for longer than necessary. 

## Implementation Details
We use Shamir's Secret Sharing over a prime field (using the `secp256k1` prime). The module provides functions to operate over Node.js `Buffer` objects. This allows the memory to be explicitly zero-filled (`buffer.fill(0)`) once the cryptographic operation completes, avoiding risks associated with immutable primitive strings that wait for Garbage Collection.

## Usage

```typescript
import { splitSecretBuffer, reconstructSecretBuffer, Share } from './shamir';
import crypto from 'crypto';

// 1. You have a master key buffer
const masterKeyBuf = crypto.randomBytes(32);

// 2. Split it into 5 shares, requiring 3 to reconstruct
const shares: Share[] = splitSecretBuffer(masterKeyBuf, 5, 3);

// 3. Clear the master key from memory immediately after splitting!
masterKeyBuf.fill(0);

// ... later, in the secure enclave ...

// 4. Reconstruct using M shares
const reconstructedBuf = reconstructSecretBuffer([shares[0], shares[2], shares[3]], 32);

// 5. Use the key for the required operation (e.g. signing a workload identity root cert)
// ...

// 6. Zero out the reconstructed key from memory!
reconstructedBuf.fill(0);
```
