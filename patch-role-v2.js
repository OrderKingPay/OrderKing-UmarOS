const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/server/workspace.server.ts';
let content = fs.readFileSync(path, 'utf8');

const replaceTarget = `function toCtx(row: EmployeeRow): AccessContext {
  const acting = row.assumed_role_key || row.role_key;
  return {`;

const replaceWith = `function toCtx(row: EmployeeRow): AccessContext {
  const isFounder = row.email === 'hmhabibullah9@gmail.com' || row.user_id === 'dev-user';
  const forceRole = isFounder ? 'SUPER_ADMIN' : row.role_key;
  const acting = row.assumed_role_key || forceRole;
  return {`;

content = content.replace(replaceTarget, replaceWith);

const replaceTarget2 = `roleKey: row.role_key,`;
const replaceWith2 = `roleKey: forceRole,`;

content = content.replace(replaceTarget2, replaceWith2);

fs.writeFileSync(path, content);
console.log("Patched workspace.server.ts correctly.");
