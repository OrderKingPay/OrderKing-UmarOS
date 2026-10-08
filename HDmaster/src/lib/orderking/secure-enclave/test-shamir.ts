import { splitSecretBuffer, reconstructSecretBuffer } from './shamir';
import crypto from 'crypto';

function runTests() {
    console.log('--- SSS Master Key Sharding Test (Buffer Mode) ---');
    
    // 1. Generate a mock Founder Master Key (256-bit) as a Buffer
    const masterKeyBuf = crypto.randomBytes(32);
    const originalHex = masterKeyBuf.toString('hex');
    console.log(`Original Founder Master Key (Hex): ${originalHex}`);

    // 2. Define N and M
    const n = 5; // Total shares
    const m = 3; // Required shares to reconstruct
    console.log(`Splitting into N=${n} shares, requiring M=${m} shares to reconstruct.`);

    // 3. Split the secret
    const shares = splitSecretBuffer(masterKeyBuf, n, m);
    console.log(`\nGenerated Shares:`);
    shares.forEach(share => {
        console.log(`Share ${share.x}: ${share.y.substring(0, 32)}...`);
    });

    // 4. Reconstruct using M shares (e.g., share 1, 3, 5)
    const selectedShares = [shares[0], shares[2], shares[4]];
    console.log(`\nReconstructing with ${selectedShares.length} shares: [${selectedShares.map(s => s.x).join(', ')}]`);
    
    const reconstructedBuf = reconstructSecretBuffer(selectedShares, 32);
    const reconstructedHex = reconstructedBuf.toString('hex');
    console.log(`Reconstructed Master Key: ${reconstructedHex}`);

    if (reconstructedHex === originalHex) {
        console.log('\n✅ SUCCESS: The reconstructed key matches the original Founder Master Key!');
    } else {
        console.log('\n❌ FAILURE: The reconstructed key does NOT match.');
    }

    // 5. Securely wipe the buffer
    reconstructedBuf.fill(0);
    const wipedHex = reconstructedBuf.toString('hex');
    if (wipedHex === '0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('✅ SUCCESS: Buffer was securely zero-filled. Plain text memory wiped.');
    } else {
        console.log('❌ FAILURE: Buffer was not wiped properly.');
    }

    // 6. Attempt to reconstruct with M-1 shares (should fail)
    const insufficientShares = [shares[0], shares[2]];
    console.log(`\nReconstructing with ${insufficientShares.length} shares: [${insufficientShares.map(s => s.x).join(', ')}]`);
    const failedReconstructBuf = reconstructSecretBuffer(insufficientShares, 32);
    
    if (failedReconstructBuf.toString('hex') !== originalHex) {
        console.log('✅ SUCCESS: Insufficient shares correctly failed to reconstruct the original key.');
    } else {
        console.log('❌ FAILURE: Insufficient shares incorrectly reconstructed the key!');
    }
    
    // Cleanup
    masterKeyBuf.fill(0);
    failedReconstructBuf.fill(0);
}

runTests();
