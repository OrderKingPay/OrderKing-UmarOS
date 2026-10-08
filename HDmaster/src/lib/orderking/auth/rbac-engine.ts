import { getSql } from '../../db';

export enum Role {
  FOUNDER = 'FOUNDER',
  ADMIN = 'ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  RIDER = 'RIDER',
  CUSTOMER = 'CUSTOMER'
}

interface PermissionResult {
  allow: boolean;
  reason?: string;
}

const permissionMatrix: Record<string, Record<string, string[]>> = {
  [Role.FOUNDER]: {
    '*': ['*']
  },
  [Role.ADMIN]: {
    'users': ['read', 'write', 'delete'],
    'restaurants': ['read', 'write', 'delete'],
    'orders': ['read', 'write', 'delete']
  },
  [Role.RESTAURANT_OWNER]: {
    'restaurants': ['read', 'write'],
    'menu': ['read', 'write', 'delete'],
    'orders': ['read', 'update_status']
  },
  [Role.RIDER]: {
    'orders': ['read', 'update_status'],
    'deliveries': ['read', 'update_status']
  },
  [Role.CUSTOMER]: {
    'orders': ['read', 'create'],
    'restaurants': ['read'],
    'menu': ['read']
  }
};

export async function checkPermission(userId: string, resource: string, action: string): Promise<PermissionResult> {
  const sql = await getSql();
  
  const user = await sql`SELECT role FROM users WHERE id = ${userId} LIMIT 1`;
  
  if (!user || user.length === 0) {
    return { allow: false, reason: 'User not found' };
  }
  
  const userRole = user[0].role as string;
  const rolePermissions = permissionMatrix[userRole];
  
  if (!rolePermissions) {
    return { allow: false, reason: 'Role not found or has no permissions' };
  }
  
  if (rolePermissions['*'] && rolePermissions['*'].includes('*')) {
    return { allow: true };
  }
  
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) {
    return { allow: false, reason: 'No permissions for this resource' };
  }
  
  if (resourcePermissions.includes('*') || resourcePermissions.includes(action)) {
    return { allow: true };
  }
  
  return { allow: false, reason: 'Action not allowed on this resource' };
}
