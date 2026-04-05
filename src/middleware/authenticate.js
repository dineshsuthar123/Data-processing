const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;

