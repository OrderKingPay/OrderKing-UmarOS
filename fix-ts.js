const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/server/workspace.server.ts';
let content = fs.readFileSync(path, 'utf8');

// Just redefine it manually to be safe.
const target = `function toCtx(row: EmployeeRow): AccessContext {
  const acting = row.assumed_role_key || row.role_key;
  return {
    userId: row.user_id ?? "",
    employeeId: row.id,
    orgId: row.org_id,
    roleKey: forceRole,
    actingRoleKey: acting,
    permissions: resolvePermissions(acting, row.custom_permissions_json),`;

const withStr = `function toCtx(row: EmployeeRow): AccessContext {
  const isFounder = row.email === 'hmhabibullah9@gmail.com' || row.user_id === 'dev-user';
  const forceRole = isFounder ? 'SUPER_ADMIN' : row.role_key;
  const acting = row.assumed_role_key || forceRole;
  return {
    userId: row.user_id ?? "",
    employeeId: row.id,
    orgId: row.org_id,
    roleKey: forceRole,
    actingRoleKey: acting,
    permissions: resolvePermissions(acting, row.custom_permissions_json),`;

content = content.replace(target, withStr);
fs.writeFileSync(path, content);
console.log("Fixed workspace.server.ts");
