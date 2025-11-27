/**
 * Permission utilities and validation
 * Provides helper functions for permission checking and validation
 */

import { AdminRole, Permission, hasPermission, hasAnyPermission, hasAllPermissions } from './roles'

/**
 * Permission check result with detailed information
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: Permission[]
  userPermissions?: Permission[]
}

/**
 * Resource type for permission checks
 */
export type ResourceType = 
  | 'user'
  | 'content'
  | 'event'
  | 'payment'
  | 'campaign'
  | 'report'
  | 'system'
  | 'role'
  | 'audit'

/**
 * Action type for permission checks
 */
export type ActionType = 
  | 'read'
  | 'write'
  | 'delete'
  | 'moderate'
  | 'export'
  | 'send'
  | 'config'

/**
 * Build a permission string from resource and action
 */
export function buildPermission(resource: string, action: string): Permission {
  return `${resource}:${action}` as Permission
}

/**
 * Check if a user can perform an action on a resource
 */
export function canPerformAction(
  role: AdminRole,
  resource: ResourceType,
  action: ActionType
): PermissionCheckResult {
  const permission = buildPermission(resource, action)
  const allowed = hasPermission(role, permission)
  
  return {
    allowed,
    reason: allowed ? undefined : `Role ${role} does not have permission ${permission}`,
    requiredPermissions: allowed ? undefined : [permission],
  }
}

/**
 * Check if a user can perform any of the specified actions
 */
export function canPerformAnyAction(
  role: AdminRole,
  checks: Array<{ resource: ResourceType; action: ActionType }>
): PermissionCheckResult {
  const permissions = checks.map(({ resource, action }) => buildPermission(resource, action))
  const allowed = hasAnyPermission(role, permissions)
  
  return {
    allowed,
    reason: allowed ? undefined : `Role ${role} does not have any of the required permissions`,
    requiredPermissions: allowed ? undefined : permissions,
  }
}

/**
 * Check if a user can perform all of the specified actions
 */
export function canPerformAllActions(
  role: AdminRole,
  checks: Array<{ resource: ResourceType; action: ActionType }>
): PermissionCheckResult {
  const permissions = checks.map(({ resource, action }) => buildPermission(resource, action))
  const allowed = hasAllPermissions(role, permissions)
  
  if (!allowed) {
    // Find which permissions are missing
    const missing = permissions.filter(p => !hasPermission(role, p))
    return {
      allowed: false,
      reason: `Role ${role} is missing permissions: ${missing.join(', ')}`,
      requiredPermissions: missing,
    }
  }
  
  return { allowed: true }
}

/**
 * Validate permissions for a specific operation
 */
export interface OperationPermissions {
  required: Permission[]
  optional?: Permission[]
  requireAll?: boolean
}

export function validateOperation(
  role: AdminRole,
  operation: OperationPermissions
): PermissionCheckResult {
  const { required, optional = [], requireAll = true } = operation
  
  // Check required permissions
  const hasRequired = requireAll
    ? hasAllPermissions(role, required)
    : hasAnyPermission(role, required)
  
  if (!hasRequired) {
    const missing = required.filter(p => !hasPermission(role, p))
    return {
      allowed: false,
      reason: requireAll
        ? `Missing required permissions: ${missing.join(', ')}`
        : `Missing at least one required permission: ${required.join(', ')}`,
      requiredPermissions: missing.length > 0 ? missing : required,
    }
  }
  
  return { allowed: true }
}

/**
 * Common permission requirements for operations
 */
export const OPERATION_PERMISSIONS = {
  // User operations
  VIEW_USER: { required: ['users:read'] } as OperationPermissions,
  EDIT_USER: { required: ['users:write'] } as OperationPermissions,
  DELETE_USER: { required: ['users:delete'] } as OperationPermissions,
  BAN_USER: { required: ['users:ban'] } as OperationPermissions,
  VERIFY_USER: { required: ['users:verify'] } as OperationPermissions,
  
  // Content operations
  VIEW_CONTENT: { required: ['content:read'] } as OperationPermissions,
  MODERATE_CONTENT: { required: ['content:moderate'] } as OperationPermissions,
  DELETE_CONTENT: { required: ['content:delete'] } as OperationPermissions,
  
  // Report operations
  VIEW_REPORTS: { required: ['reports:read'] } as OperationPermissions,
  RESOLVE_REPORT: { required: ['reports:resolve'] } as OperationPermissions,
  
  // Payment operations
  VIEW_PAYMENTS: { required: ['payments:read'] } as OperationPermissions,
  REFUND_PAYMENT: { required: ['payments:refund'] } as OperationPermissions,
  EXPORT_PAYMENTS: { required: ['payments:export'] } as OperationPermissions,
  
  // Analytics operations
  VIEW_ANALYTICS: { required: ['analytics:read'] } as OperationPermissions,
  EXPORT_ANALYTICS: { required: ['analytics:export'] } as OperationPermissions,
  
  // Event operations
  VIEW_EVENTS: { required: ['events:read'] } as OperationPermissions,
  CREATE_EVENT: { required: ['events:write'] } as OperationPermissions,
  EDIT_EVENT: { required: ['events:write'] } as OperationPermissions,
  DELETE_EVENT: { required: ['events:delete'] } as OperationPermissions,
  
  // Campaign operations
  VIEW_CAMPAIGNS: { required: ['campaigns:read'] } as OperationPermissions,
  CREATE_CAMPAIGN: { required: ['campaigns:write'] } as OperationPermissions,
  EDIT_CAMPAIGN: { required: ['campaigns:write'] } as OperationPermissions,
  SEND_CAMPAIGN: { required: ['campaigns:send'] } as OperationPermissions,
  
  // System operations
  VIEW_SYSTEM: { required: ['system:read'] } as OperationPermissions,
  EDIT_SYSTEM: { required: ['system:write'] } as OperationPermissions,
  CONFIG_SYSTEM: { required: ['system:config'] } as OperationPermissions,
  MANAGE_JOBS: { required: ['system:jobs'] } as OperationPermissions,
  
  // Role operations
  VIEW_ROLES: { required: ['roles:read'] } as OperationPermissions,
  EDIT_ROLES: { required: ['roles:write'] } as OperationPermissions,
  
  // Audit operations
  VIEW_AUDIT: { required: ['audit:read'] } as OperationPermissions,
  EXPORT_AUDIT: { required: ['audit:export'] } as OperationPermissions,
}

/**
 * Check if a user has permission for a common operation
 */
export function canPerformOperation(
  role: AdminRole,
  operationKey: keyof typeof OPERATION_PERMISSIONS
): PermissionCheckResult {
  const operation = OPERATION_PERMISSIONS[operationKey]
  return validateOperation(role, operation)
}

/**
 * Permission scopes for fine-grained access control
 */
export interface PermissionScope {
  userId?: string
  organizationId?: string
  eventId?: string
  contentType?: string
}

/**
 * Context for permission checks
 */
export interface PermissionContext {
  role: AdminRole
  userId: string
  scope?: PermissionScope
}

/**
 * Check if a user can access a specific resource
 * Can be extended with ABAC (Attribute-Based Access Control) logic
 */
export function canAccessResource(
  context: PermissionContext,
  resource: ResourceType,
  action: ActionType,
  resourceOwnerId?: string
): PermissionCheckResult {
  const baseCheck = canPerformAction(context.role, resource, action)
  
  if (!baseCheck.allowed) {
    return baseCheck
  }
  
  // ABAC: Allow users to access their own resources
  if (resourceOwnerId && context.userId === resourceOwnerId) {
    return { allowed: true }
  }
  
  // Additional scope-based checks can be added here
  // For example: check if user belongs to same organization
  
  return { allowed: true }
}

/**
 * Batch permission check for multiple permissions
 */
export function checkPermissions(
  role: AdminRole,
  permissions: Permission[]
): Record<Permission, boolean> {
  return permissions.reduce((acc, permission) => {
    acc[permission] = hasPermission(role, permission)
    return acc
  }, {} as Record<Permission, boolean>)
}

/**
 * Get missing permissions for an operation
 */
export function getMissingPermissions(
  role: AdminRole,
  required: Permission[]
): Permission[] {
  return required.filter(p => !hasPermission(role, p))
}

/**
 * Format permission for display
 */
export function formatPermission(permission: Permission): string {
  const [resource, action] = permission.split(':')
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`
}

/**
 * Parse permission string into components
 */
export function parsePermission(permission: Permission): { resource: string; action: string } {
  const [resource, action] = permission.split(':')
  return { resource, action }
}

/**
 * Group permissions by resource
 */
export function groupPermissionsByResource(
  permissions: Permission[]
): Record<string, string[]> {
  return permissions.reduce((acc, permission) => {
    const { resource, action } = parsePermission(permission)
    if (!acc[resource]) {
      acc[resource] = []
    }
    acc[resource].push(action)
    return acc
  }, {} as Record<string, string[]>)
}
