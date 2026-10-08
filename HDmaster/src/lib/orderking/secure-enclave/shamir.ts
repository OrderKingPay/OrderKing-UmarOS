import crypto from 'crypto';

// Use the secp256k1 prime for the finite field
const PRIME = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');

/**
 * Evaluates a polynomial at x, where polynomial coefficients are given.
 * polynomial[0] is the constant term (the secret).
 */
function evaluatePolynomial(polynomial: bigint[], x: bigint): bigint {
    let result = 0n;
    let power = 1n;
    for (let i = 0; i < polynomial.length; i++) {
        const term = (polynomial[i] * power) % PRIME;
        result = (result + term) % PRIME;
        power = (power * x) % PRIME;
    }
    return result;
}

/**
 * Generates a random bigint less than max.
 */
function randomBigInt(max: bigint): bigint {
    const byteLength = (max.toString(16).length + 1) >> 1;
    let num: bigint;
    do {
        const buf = crypto.randomBytes(byteLength);
        num = BigInt('0x' + buf.toString('hex'));
    } while (num >= max);
    return num;
}

export interface Share {
    x: number;
    y: string; // Hex representation
}

/**
 * Splits a secret buffer into n shares, requiring k shares to reconstruct.
 * Returns an array of shares.
 */
export function splitSecretBuffer(secretBuf: Buffer, n: number, k: number): Share[] {
    const secretHex = secretBuf.toString('hex');
    const secret = BigInt('0x' + secretHex);
    if (secret >= PRIME) {
        throw new Error('Secret is too large');
    }

    const polynomial: bigint[] = [secret];
    for (let i = 1; i < k; i++) {
        polynomial.push(randomBigInt(PRIME));
    }

    const shares: Share[] = [];
    for (let i = 1; i <= n; i++) {
        const x = BigInt(i);
        const y = evaluatePolynomial(polynomial, x);
        shares.push({ x: i, y: y.toString(16) });
    }

    return shares;
}

/**
 * Computes the modular inverse of a modulo m using the Extended Euclidean Algorithm.
 */
function modInverse(a: bigint, m: bigint): bigint {
    let m0 = m;
    let y = 0n;
    let x = 1n;

    if (m === 1n) return 0n;

    while (a > 1n) {
        const q = a / m;
        let t = m;

        m = a % m;
        a = t;
        t = y;

        y = x - q * y;
        x = t;
    }

    if (x < 0n) x += m0;

    return x;
}

/**
 * Reconstructs the secret from at least k shares using Lagrange interpolation.
 * Returns a Buffer which can be securely zero-filled after use.
 * 
 * IMPORTANT: To satisfy "Founder master keys cannot reside in plain text memory",
 * callers MUST securely wipe the returned Buffer after use:
 *   const keyBuf = reconstructSecretBuffer(shares, 32);
 *   // ... use keyBuf ...
 *   keyBuf.fill(0); 
 */
export function reconstructSecretBuffer(shares: Share[], expectedByteLength: number = 32): Buffer {
    let secret = 0n;

    for (let i = 0; i < shares.length; i++) {
        const x_i = BigInt(shares[i].x);
        const y_i = BigInt('0x' + shares[i].y);

        let numerator = 1n;
        let denominator = 1n;

        for (let j = 0; j < shares.length; j++) {
            if (i === j) continue;
            const x_j = BigInt(shares[j].x);

            numerator = (numerator * (0n - x_j)) % PRIME;
            let diff = (x_i - x_j) % PRIME;
            if (diff < 0n) {
                diff += PRIME;
            }
            denominator = (denominator * diff) % PRIME;
        }

        if (numerator < 0n) {
            numerator += PRIME;
        }

        const denomInverse = modInverse(denominator, PRIME);
        const term = (y_i * numerator * denomInverse) % PRIME;
        
        secret = (secret + term) % PRIME;
    }

    let secretHex = secret.toString(16);
    // Pad to match original buffer length
    while (secretHex.length < expectedByteLength * 2) {
        secretHex = '0' + secretHex;
    }

    return Buffer.from(secretHex, 'hex');
}
