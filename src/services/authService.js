const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const env = require('../config/environment');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

/**
 * Register a new user
 */
const register = async (email, password, firstName, lastName) => {
  const existingUser = await db.User.findOne({ where: { email } });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Default role is VIEWER
  const viewerRole = await db.Role.findOne({ where: { name: 'VIEWER' } });

  const user = await db.User.create({
    email,
    password: hashedPassword,
    firstName: firstName || '',
    lastName: lastName || '',
    roleId: viewerRole.id,
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

/**
 * Login user and return JWT token
 */
const login = async (email, password) => {
  const user = await db.User.findOne({
    where: { email },
    include: [{ model: db.Role, as: 'role' }],
  });

  if (!user) {
    throw new BadRequestError('Invalid email or password');
  }

  if (!user.active) {
    throw new BadRequestError('User account is inactive');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new BadRequestError('Invalid email or password');
  }

  // Update last login
  await user.update({ lastLogin: new Date() });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    },
  };
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const user = await db.User.findByPk(userId, {
    include: [{ model: db.Role, as: 'role' }],
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

module.exports = {
  register,
  login,
  getUserById,
};

