/**
 * Permission and Role Management Utilities
 */

const ROLE_PERMISSIONS = {
  VIEWER: {
    canViewRecords: true,
    canCreateRecords: false,
    canUpdateRecords: false,
    canDeleteRecords: false,
    canViewDashboard: true,
    canExportData: false,
    canManageUsers: false,
    canManageRoles: false,
  },
  ANALYST: {
    canViewRecords: true,
    canCreateRecords: true,
    canUpdateRecords: true,
    canDeleteRecords: true,
    canViewDashboard: true,
    canExportData: true,
    canManageUsers: false,
    canManageRoles: false,
  },
  ADMIN: {
    canViewRecords: true,
    canCreateRecords: true,
    canUpdateRecords: true,
    canDeleteRecords: true,
    canViewDashboard: true,
    canExportData: true,
    canManageUsers: true,
    canManageRoles: true,
  },
};

/**
 * Check if user has permission for an action
 */
const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions[permission] === true;
};

/**
 * Check if user can access a record
 * Users can only access their own records unless they're Analyst or Admin
 */
const canAccessRecord = (userRole, recordUserId, currentUserId) => {
  if (userRole === 'ADMIN' || userRole === 'ANALYST') {
    return true;
  }
  // VIEWER can only access own records
  return recordUserId === currentUserId;
};

module.exports = {
  ROLE_PERMISSIONS,
  hasPermission,
  canAccessRecord,
};

