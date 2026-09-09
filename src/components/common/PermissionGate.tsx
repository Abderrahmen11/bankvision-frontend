import React from 'react'
import { usePermission, type PermissionKey } from '@/hooks/usePermission'
import type { UserRole } from '@/types/user'

export interface PermissionGateProps {
  /**
   * Named permission flag key from usePermission() (e.g. 'canDeleteCustomer', 'canApproveLoan')
   */
  permission?: PermissionKey

  /**
   * Array of UserRoles allowed to view the children (alternative or addition to permission)
   */
  roles?: UserRole[]

  /**
   * Custom evaluator callback function for complex composite checks
   */
  predicate?: (permissions: ReturnType<typeof usePermission>) => boolean

  /**
   * Optional fallback node to render when permission check fails (defaults to null)
   */
  fallback?: React.ReactNode

  /**
   * Protected children to render if authorized
   */
  children: React.ReactNode
}

/**
 * Component-level Role-Based Access Control gate.
 * Conditionally mounts children only if current user satisfies role/permission criteria.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  roles,
  predicate,
  fallback = null,
  children,
}) => {
  const permissions = usePermission()

  // 1. Check custom predicate if provided
  if (predicate && !predicate(permissions)) {
    return <>{fallback}</>
  }

  // 2. Check named permission flag if provided
  if (permission && !permissions[permission]) {
    return <>{fallback}</>
  }

  // 3. Check roles array if provided
  if (roles && roles.length > 0 && !permissions.hasAnyRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
