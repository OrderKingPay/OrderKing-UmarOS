/**
 * Historical crypto patch helper.
 *
 * This file is intentionally fail-closed. Previous behavior could replace real
 * HMAC/SHA-256 logic with Math.random(), which is unsafe for authentication,
 * payment verification, or audit integrity.
 *
 * It is retained for compatibility but performs NO source mutation.
 */
import process from "node:process";

console.error(
  "[SECURITY] patch-crypto.mjs is disabled. It will not modify source code or downgrade cryptography."
);
process.exitCode = 1;
