import { addNode, addEdge, queryPath } from './index';

addNode('Alice', { type: 'Person', age: 30 });
addNode('Bob', { type: 'Person', age: 35 });
addNode('CompanyX', { type: 'Company' });

addEdge('Alice', 'Bob', 'KNOWS', { since: 2020 });
addEdge('Bob', 'CompanyX', 'WORKS_AT', { role: 'Engineer' });

console.log("Path from Alice to CompanyX:");
const path = queryPath('Alice', 'CompanyX');
console.log(JSON.stringify(path, null, 2));

console.log("Path from CompanyX to Alice (should be null, since directed):");
console.log(queryPath('CompanyX', 'Alice'));
