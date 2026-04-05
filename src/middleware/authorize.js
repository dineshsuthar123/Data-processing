const { ForbiddenError } = require('../utils/errors');
const { hasPermission } = require('../utils/permissions');

/**
 * Authorize users based on role and permission
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRole = req.user.role;

    if (!hasPermission(userRole, requiredPermission)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

module.exports = authorize;

