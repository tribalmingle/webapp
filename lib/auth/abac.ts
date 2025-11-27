/**
 * ABAC (Attribute-Based Access Control) Policy Engine
 * Provides fine-grained, context-aware access control based on user attributes,
 * resource properties, and environmental conditions.
 */

import { AdminRole } from './roles'

/**
 * Policy subject - the user performing the action
 */
export interface PolicySubject {
  userId: string
  role: AdminRole
  tribes?: string[]
  isPremium?: boolean
  emailVerified?: boolean
  accountAge?: number // days since account creation
  trustScore?: number // 0-100
  location?: {
    country?: string
    region?: string
    ip?: string
  }
}

/**
 * Policy resource - the object being accessed
 */
export interface PolicyResource {
  type: 'user' | 'profile' | 'content' | 'payment' | 'event' | 'message' | 'match' | 'system'
  id: string
  ownerId?: string
  visibility?: 'public' | 'members' | 'private'
  status?: string
  metadata?: Record<string, any>
}

/**
 * Policy context - environmental/temporal conditions
 */
export interface PolicyContext {
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  location?: {
    country?: string
    region?: string
  }
  deviceTrusted?: boolean
  mfaVerified?: boolean
  sessionAge?: number // minutes since login
  requestOrigin?: 'web' | 'mobile' | 'api'
}

/**
 * Policy action - what operation is being performed
 */
export type PolicyAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'share'
  | 'message'
  | 'match'

/**
 * Policy condition - a rule that must be satisfied
 */
export interface PolicyCondition {
  type:
    | 'role'
    | 'ownership'
    | 'visibility'
    | 'time'
    | 'location'
    | 'trust'
    | 'verification'
    | 'custom'
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'greaterThan' | 'lessThan' | 'contains'
  field: string
  value: any
}

/**
 * Policy effect - what happens if conditions match
 */
export type PolicyEffect = 'allow' | 'deny'

/**
 * Complete ABAC policy
 */
export interface ABACPolicy {
  id: string
  name: string
  description?: string
  version: string
  priority: number // higher priority policies evaluated first
  effect: PolicyEffect
  subjects?: {
    roles?: AdminRole[]
    userIds?: string[]
    conditions?: PolicyCondition[]
  }
  resources?: {
    types?: PolicyResource['type'][]
    ids?: string[]
    conditions?: PolicyCondition[]
  }
  actions?: PolicyAction[]
  conditions?: PolicyCondition[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluation {
  decision: 'allow' | 'deny' | 'not-applicable'
  matchedPolicies: string[]
  reason?: string
  metadata?: Record<string, any>
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: PolicyCondition,
  subject: PolicySubject,
  resource: PolicyResource,
  context: PolicyContext
): boolean {
  const getValue = (field: string): any => {
    if (field.startsWith('subject.')) {
      const key = field.substring(8)
      return (subject as any)[key]
    }
    if (field.startsWith('resource.')) {
      const key = field.substring(9)
      return (resource as any)[key]
    }
    if (field.startsWith('context.')) {
      const key = field.substring(8)
      return (context as any)[key]
    }
    return undefined
  }

  const actualValue = getValue(condition.field)
  const expectedValue = condition.value

  switch (condition.operator) {
    case 'equals':
      return actualValue === expectedValue
    case 'notEquals':
      return actualValue !== expectedValue
    case 'in':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue)
    case 'notIn':
      return Array.isArray(expectedValue) && !expectedValue.includes(actualValue)
    case 'greaterThan':
      return actualValue > expectedValue
    case 'lessThan':
      return actualValue < expectedValue
    case 'contains':
      if (Array.isArray(actualValue)) {
        return actualValue.includes(expectedValue)
      }
      if (typeof actualValue === 'string') {
        return actualValue.includes(expectedValue)
      }
      return false
    default:
      return false
  }
}

/**
 * Check if a policy applies to the given request
 */
function policyApplies(
  policy: ABACPolicy,
  subject: PolicySubject,
  resource: PolicyResource,
  action: PolicyAction,
  context: PolicyContext
): boolean {
  // Check if policy is active
  if (!policy.active) {
    return false
  }

  // Check subject constraints
  if (policy.subjects) {
    if (policy.subjects.roles && !policy.subjects.roles.includes(subject.role)) {
      return false
    }
    if (policy.subjects.userIds && !policy.subjects.userIds.includes(subject.userId)) {
      return false
    }
    if (policy.subjects.conditions) {
      for (const condition of policy.subjects.conditions) {
        if (!evaluateCondition(condition, subject, resource, context)) {
          return false
        }
      }
    }
  }

  // Check resource constraints
  if (policy.resources) {
    if (policy.resources.types && !policy.resources.types.includes(resource.type)) {
      return false
    }
    if (policy.resources.ids && !policy.resources.ids.includes(resource.id)) {
      return false
    }
    if (policy.resources.conditions) {
      for (const condition of policy.resources.conditions) {
        if (!evaluateCondition(condition, subject, resource, context)) {
          return false
        }
      }
    }
  }

  // Check action constraints
  if (policy.actions && !policy.actions.includes(action)) {
    return false
  }

  // Check general conditions
  if (policy.conditions) {
    for (const condition of policy.conditions) {
      if (!evaluateCondition(condition, subject, resource, context)) {
        return false
      }
    }
  }

  return true
}

/**
 * Evaluate access based on ABAC policies
 * 
 * Policy evaluation follows these rules:
 * 1. Policies are evaluated in priority order (highest first)
 * 2. First explicit allow or deny wins
 * 3. If no policies match, default to deny
 */
export function evaluateAccess(
  subject: PolicySubject,
  resource: PolicyResource,
  action: PolicyAction,
  context: PolicyContext,
  policies: ABACPolicy[]
): PolicyEvaluation {
  const matchedPolicies: string[] = []
  
  // Sort policies by priority (highest first)
  const sortedPolicies = [...policies].sort((a, b) => b.priority - a.priority)

  for (const policy of sortedPolicies) {
    if (policyApplies(policy, subject, resource, action, context)) {
      matchedPolicies.push(policy.id)
      
      // First matching policy wins
      return {
        decision: policy.effect === 'allow' ? 'allow' : 'deny',
        matchedPolicies,
        reason: policy.description || policy.name,
        metadata: {
          policyId: policy.id,
          policyVersion: policy.version,
          policyPriority: policy.priority,
        },
      }
    }
  }

  // No policies matched - default deny
  return {
    decision: 'deny',
    matchedPolicies: [],
    reason: 'No matching policies found - default deny',
  }
}

/**
 * Pre-defined policy templates
 */

/**
 * Owner can view/update their own resources
 */
export function createOwnershipPolicy(priority: number = 100): ABACPolicy {
  return {
    id: 'policy-ownership-own-resources',
    name: 'Owner Access',
    description: 'Users can view and update their own resources',
    version: '1.0',
    priority,
    effect: 'allow',
    actions: ['view', 'update'],
    conditions: [
      {
        type: 'ownership',
        operator: 'equals',
        field: 'subject.userId',
        value: 'resource.ownerId',
      },
    ],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Admins can access all resources
 */
export function createAdminFullAccessPolicy(priority: number = 1000): ABACPolicy {
  return {
    id: 'policy-admin-full-access',
    name: 'Admin Full Access',
    description: 'Admins have full access to all resources',
    version: '1.0',
    priority,
    effect: 'allow',
    subjects: {
      roles: ['super_admin', 'admin'],
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Premium users can view all public profiles
 */
export function createPremiumViewPolicy(priority: number = 50): ABACPolicy {
  return {
    id: 'policy-premium-view-profiles',
    name: 'Premium Profile View',
    description: 'Premium users can view all public profiles',
    version: '1.0',
    priority,
    effect: 'allow',
    subjects: {
      conditions: [
        {
          type: 'verification',
          operator: 'equals',
          field: 'subject.isPremium',
          value: true,
        },
      ],
    },
    resources: {
      types: ['profile'],
      conditions: [
        {
          type: 'visibility',
          operator: 'in',
          field: 'resource.visibility',
          value: ['public', 'members'],
        },
      ],
    },
    actions: ['view'],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Require MFA for sensitive actions
 */
export function createMFARequiredPolicy(priority: number = 900): ABACPolicy {
  return {
    id: 'policy-mfa-required-sensitive',
    name: 'MFA Required for Sensitive Actions',
    description: 'Sensitive actions require MFA verification',
    version: '1.0',
    priority,
    effect: 'deny',
    actions: ['delete', 'export'],
    conditions: [
      {
        type: 'verification',
        operator: 'notEquals',
        field: 'context.mfaVerified',
        value: true,
      },
    ],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Deny access from untrusted locations
 */
export function createLocationRestrictionPolicy(
  allowedCountries: string[],
  priority: number = 800
): ABACPolicy {
  return {
    id: 'policy-location-restriction',
    name: 'Location Restriction',
    description: 'Deny access from restricted countries',
    version: '1.0',
    priority,
    effect: 'deny',
    conditions: [
      {
        type: 'location',
        operator: 'notIn',
        field: 'context.location.country',
        value: allowedCountries,
      },
    ],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Helper to check if access is allowed
 */
export function isAccessAllowed(evaluation: PolicyEvaluation): boolean {
  return evaluation.decision === 'allow'
}

/**
 * Helper to get denial reason
 */
export function getDenialReason(evaluation: PolicyEvaluation): string {
  return evaluation.reason || 'Access denied'
}
