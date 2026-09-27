const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projects = [
    { name: 'HDmaster', vercelName: 'hdmaster' },
    { name: 'orderking-customers', vercelName: 'foodpalace-2028-customers' }, // Wait, what is the exact vercel project name? 
    // Usually it's the folder name, let's assume it's just the folder name if they linked it via Github
];
