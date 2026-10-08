#!/usr/bin/env node

const DependencyThreatScanner = require('./DependencyThreatScanner');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../');
const scanner = new DependencyThreatScanner(projectRoot);

console.log('--- SUPPLY-CHAIN FIREWALL INTERCEPT ---');
const isSafe = scanner.scan();

if (!isSafe) {
    console.error('❌ BUILD BLOCKED BY SUPPLY-CHAIN FIREWALL.');
    process.exit(1);
} else {
    console.log('✅ Dependencies verified. Build proceeding.');
    process.exit(0);
}
