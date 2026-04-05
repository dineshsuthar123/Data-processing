const bcrypt = require('bcrypt');
const db = require('../models');
const { createUserSchema, updateUserSchema, updateUserRoleSchema } = require('../validators/userValidator');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Get all users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.User.findAndCountAll({
      include: [{ model: db.Role, as: 'role', attributes: ['name'] }],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Users retrieved successfully',
      users: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create user (admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await db.User.findOne({ where: { email: value.email } });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const role = await db.Role.findByPk(value.roleId);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);

    const user = await db.User.create({
      email: value.email,
      password: hashedPassword,
      firstName: value.firstName || '',
      lastName: value.lastName || '',
      roleId: value.roleId,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
const getUser = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      include: [{ model: db.Role, as: 'role' }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
const updateUser = async (req, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.update(value);

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        active: user.active,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { error, value } = updateUserRoleSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const role = await db.Role.findByPk(value.roleId);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    await user.update({ roleId: value.roleId });

    res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.update({ active: false });

    res.status(200).json({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  getUser,
  updateUser,
  updateUserRole,
  deleteUser,
};

