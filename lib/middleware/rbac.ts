/**
 * RBAC Middleware
 * Role-Based Access Control middleware for protecting admin routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { AdminRole, Permission } from '@/lib/auth/roles'
import {
  canPerformAction,
  canPerformOperation,
  validateOperation,
  OperationPermissions,
  PermissionCheckResult,
  OPERATION_PERMISSIONS,
} from '@/lib/auth/permissions'
import { getMongoDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { ObjectId } from 'mongodb'

/**
 * Admin user interface
 */
export interface AdminUser {
  _id: string
  email: string
  role: AdminRole
  isActive: boolean
  permissions?: Permission[]
}

/**
 * RBAC options for middleware
 */
export interface RBACOptions {
  requiredPermissions?: Permission[]
  requiredRole?: AdminRole
  requireAll?: boolean
  operation?: keyof typeof OPERATION_PERMISSIONS
  customCheck?: (user: AdminUser) => Promise<PermissionCheckResult>
}

/**
 * Get admin user from request
 * TODO: Replace with next-auth session once implemented
 */
async function getAdminUser(request: NextRequest): Promise<AdminUser | null> {
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role') as AdminRole | null
  
  if (!userId || !role) {
    return null
  }
  
  // TODO: Validate user session with next-auth
  // For now, trust the headers (development only)
  
  const db = await getMongoDb()
  const user = await db.collection(COLLECTIONS.USERS).findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, role: 1, isActive: 1 } }
  )
  
  if (!user) {
    return null
  }
  
  return {
    _id: user._id.toHexString(),
    email: user.email,
    role: user.role || role,
    isActive: user.isActive !== false,
  }
}

/**
 * Create a 403 Forbidden response
 */
function createForbiddenResponse(reason: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: reason,
    },
    { status: 403 }
  )
}

/**
 * Create a 401 Unauthorized response
 */
function createUnauthorizedResponse(reason = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: reason,
    },
    { status: 401 }
  )
}

/**
 * RBAC middleware for protecting routes
 * Usage in API routes:
 * 
 * export async function GET(request: NextRequest) {
 *   const authCheck = await requirePermissions(request, {
 *     operation: 'VIEW_USERS',
 *   })
 *   if (authCheck.error) return authCheck.error
 *   
 *   // Continue with authorized request
 *   const user = authCheck.user
 * }
 */
export async function requirePermissions(
  request: NextRequest,
  options: RBACOptions
): Promise<{ user: AdminUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getAdminUser(request)
  
  if (!user) {
    return { error: createUnauthorizedResponse('Admin authentication required') }
  }
  
  if (!user.isActive) {
    return { error: createForbiddenResponse('Account is inactive') }
  }
  
  // Check operation permission if specified
  if (options.operation) {
    const result = canPerformOperation(user.role, options.operation)
    if (!result.allowed) {
      return { error: createForbiddenResponse(result.reason || 'Permission denied') }
    }
  }
  
  // Check required permissions if specified
  if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    const operation: OperationPermissions = {
      required: options.requiredPermissions,
      requireAll: options.requireAll !== false,
    }
    const result = validateOperation(user.role, operation)
    if (!result.allowed) {
      return { error: createForbiddenResponse(result.reason || 'Insufficient permissions') }
    }
  }
  
  // Check required role if specified
  if (options.requiredRole) {
    const requiredLevel = ROLE_HIERARCHY[options.requiredRole]
    const userLevel = ROLE_HIERARCHY[user.role]
    
    if (userLevel < requiredLevel) {
      return {
        error: createForbiddenResponse(
          `This action requires ${options.requiredRole} role or higher`
        ),
      }
    }
  }
  
  // Custom check if provided
  if (options.customCheck) {
    const result = await options.customCheck(user)
    if (!result.allowed) {
      return { error: createForbiddenResponse(result.reason || 'Permission denied') }
    }
  }
  
  return { user }
}

/**
 * Role hierarchy for comparison
 */
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 60,
  support: 40,
  analyst: 20,
  viewer: 10,
}

/**
 * Quick helper for checking single permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ user: AdminUser; error?: never } | { user?: never; error: NextResponse }> {
  return requirePermissions(request, {
    requiredPermissions: [permission],
  })
}

/**
 * Quick helper for checking role
 */
export async function requireRole(
  request: NextRequest,
  role: AdminRole
): Promise<{ user: AdminUser; error?: never } | { user?: never; error: NextResponse }> {
  return requirePermissions(request, {
    requiredRole: role,
  })
}

/**
 * Middleware for super admin only
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ user: AdminUser; error?: never } | { user?: never; error: NextResponse }> {
  return requireRole(request, 'super_admin')
}

/**
 * Middleware for admin or higher
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AdminUser; error?: never } | { user?: never; error: NextResponse }> {
  return requireRole(request, 'admin')
}

/**
 * Middleware for moderator or higher
 */
export async function requireModerator(
  request: NextRequest
): Promise<{ user: AdminUser; error?: never } | { user?: never; error: NextResponse }> {
  return requireRole(request, 'moderator')
}

/**
 * Decorator for wrapping API route handlers with RBAC
 */
export function withRBAC(
  handler: (request: NextRequest, user: AdminUser, context?: any) => Promise<NextResponse>,
  options: RBACOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const authCheck = await requirePermissions(request, options)
    
    if (authCheck.error) {
      return authCheck.error
    }
    
    return handler(request, authCheck.user, context)
  }
}

/**
 * Example usage in API routes:
 * 
 * // Using decorator
 * export const GET = withRBAC(
 *   async (request, user) => {
 *     // user is typed as AdminUser
 *     return NextResponse.json({ users: [] })
 *   },
 *   { operation: 'VIEW_USERS' }
 * )
 * 
 * // Using direct check
 * export async function POST(request: NextRequest) {
 *   const authCheck = await requirePermissions(request, {
 *     requiredPermissions: ['users:write', 'users:verify'],
 *     requireAll: true,
 *   })
 *   
 *   if (authCheck.error) return authCheck.error
 *   
 *   const user = authCheck.user
 *   // Continue with authorized logic
 * }
 * 
 * // Resource-specific check
 * export async function DELETE(request: NextRequest) {
 *   const authCheck = await requirePermissions(request, {
 *     customCheck: async (user) => {
 *       const targetUserId = request.nextUrl.searchParams.get('userId')
 *       
 *       // Prevent deleting higher-privileged users
 *       const targetUser = await getUserById(targetUserId)
 *       if (ROLE_HIERARCHY[targetUser.role] >= ROLE_HIERARCHY[user.role]) {
 *         return {
 *           allowed: false,
 *           reason: 'Cannot delete users with equal or higher privileges',
 *         }
 *       }
 *       
 *       return { allowed: true }
 *     },
 *   })
 *   
 *   if (authCheck.error) return authCheck.error
 *   
 *   // Proceed with deletion
 * }
 */
