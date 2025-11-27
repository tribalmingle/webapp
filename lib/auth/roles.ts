/**
 * Role Definitions for RBAC
 * Defines role hierarchy and permissions for admin access control
 */

export type AdminRole = 
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'analyst'
  | 'viewer'

export type Permission = 
  // User management
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:ban'
  | 'users:verify'
  
  // Content moderation
  | 'content:read'
  | 'content:moderate'
  | 'content:delete'
  | 'reports:read'
  | 'reports:resolve'
  
  // Payments
  | 'payments:read'
  | 'payments:refund'
  | 'payments:export'
  
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  
  // Events
  | 'events:read'
  | 'events:write'
  | 'events:delete'
  
  // Campaigns
  | 'campaigns:read'
  | 'campaigns:write'
  | 'campaigns:send'
  
  // System
  | 'system:read'
  | 'system:write'
  | 'system:config'
  | 'system:jobs'
  
  // Roles & permissions
  | 'roles:read'
  | 'roles:write'
  
  // Audit logs
  | 'audit:read'
  | 'audit:export'

/**
 * Role hierarchy with inheritance
 * Lower roles inherit permissions from higher roles
 */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 60,
  support: 40,
  analyst: 20,
  viewer: 10,
}

/**
 * Permissions granted to each role
 * Roles inherit permissions from lower-level roles
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    // Has all permissions
    'users:read', 'users:write', 'users:delete', 'users:ban', 'users:verify',
    'content:read', 'content:moderate', 'content:delete',
    'reports:read', 'reports:resolve',
    'payments:read', 'payments:refund', 'payments:export',
    'analytics:read', 'analytics:export',
    'events:read', 'events:write', 'events:delete',
    'campaigns:read', 'campaigns:write', 'campaigns:send',
    'system:read', 'system:write', 'system:config', 'system:jobs',
    'roles:read', 'roles:write',
    'audit:read', 'audit:export',
  ],
  
  admin: [
    // Most permissions except system config and role management
    'users:read', 'users:write', 'users:ban', 'users:verify',
    'content:read', 'content:moderate', 'content:delete',
    'reports:read', 'reports:resolve',
    'payments:read', 'payments:refund', 'payments:export',
    'analytics:read', 'analytics:export',
    'events:read', 'events:write', 'events:delete',
    'campaigns:read', 'campaigns:write', 'campaigns:send',
    'system:read', 'system:jobs',
    'audit:read', 'audit:export',
  ],
  
  moderator: [
    // Content moderation and user management
    'users:read', 'users:ban',
    'content:read', 'content:moderate', 'content:delete',
    'reports:read', 'reports:resolve',
    'analytics:read',
    'events:read',
    'audit:read',
  ],
  
  support: [
    // User support and basic content viewing
    'users:read', 'users:verify',
    'content:read',
    'reports:read',
    'payments:read',
    'events:read',
    'audit:read',
  ],
  
  analyst: [
    // Analytics and reporting
    'users:read',
    'analytics:read', 'analytics:export',
    'payments:read',
    'events:read',
    'campaigns:read',
  ],
  
  viewer: [
    // Read-only access
    'users:read',
    'content:read',
    'analytics:read',
    'events:read',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes(permission)
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if roleA has higher privileges than roleB
 */
export function isHigherRole(roleA: AdminRole, roleB: AdminRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB]
}

/**
 * Check if roleA has equal or higher privileges than roleB
 */
export function isEqualOrHigherRole(roleA: AdminRole, roleB: AdminRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB]
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: AdminRole[]): AdminRole | null {
  if (roles.length === 0) return null
  
  return roles.reduce((highest, current) => {
    return isHigherRole(current, highest) ? current : highest
  })
}

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  'User Management': [
    'users:read',
    'users:write',
    'users:delete',
    'users:ban',
    'users:verify',
  ] as Permission[],
  
  'Content Moderation': [
    'content:read',
    'content:moderate',
    'content:delete',
    'reports:read',
    'reports:resolve',
  ] as Permission[],
  
  'Payments': [
    'payments:read',
    'payments:refund',
    'payments:export',
  ] as Permission[],
  
  'Analytics': [
    'analytics:read',
    'analytics:export',
  ] as Permission[],
  
  'Events': [
    'events:read',
    'events:write',
    'events:delete',
  ] as Permission[],
  
  'Campaigns': [
    'campaigns:read',
    'campaigns:write',
    'campaigns:send',
  ] as Permission[],
  
  'System': [
    'system:read',
    'system:write',
    'system:config',
    'system:jobs',
  ] as Permission[],
  
  'Administration': [
    'roles:read',
    'roles:write',
    'audit:read',
    'audit:export',
  ] as Permission[],
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'users:read': 'View user profiles and details',
  'users:write': 'Edit user profiles and settings',
  'users:delete': 'Delete user accounts',
  'users:ban': 'Ban or suspend users',
  'users:verify': 'Verify user identities',
  
  'content:read': 'View all content',
  'content:moderate': 'Approve or reject content',
  'content:delete': 'Delete inappropriate content',
  'reports:read': 'View user reports',
  'reports:resolve': 'Resolve user reports',
  
  'payments:read': 'View payment transactions',
  'payments:refund': 'Process refunds',
  'payments:export': 'Export payment data',
  
  'analytics:read': 'View analytics dashboards',
  'analytics:export': 'Export analytics data',
  
  'events:read': 'View events',
  'events:write': 'Create and edit events',
  'events:delete': 'Delete events',
  
  'campaigns:read': 'View marketing campaigns',
  'campaigns:write': 'Create and edit campaigns',
  'campaigns:send': 'Send campaigns to users',
  
  'system:read': 'View system settings',
  'system:write': 'Modify system settings',
  'system:config': 'Modify system configuration',
  'system:jobs': 'Manage background jobs',
  
  'roles:read': 'View roles and permissions',
  'roles:write': 'Modify roles and permissions',
  
  'audit:read': 'View audit logs',
  'audit:export': 'Export audit logs',
}

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full system access with all permissions',
  admin: 'Administrative access with most permissions',
  moderator: 'Content moderation and user management',
  support: 'User support and basic viewing',
  analyst: 'Analytics and reporting access',
  viewer: 'Read-only access to most features',
}
