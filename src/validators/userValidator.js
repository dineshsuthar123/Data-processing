const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  roleId: Joi.number().required(),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  active: Joi.boolean().optional(),
});

const updateUserRoleSchema = Joi.object({
  roleId: Joi.number().required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
};

