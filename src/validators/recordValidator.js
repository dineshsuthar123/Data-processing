const Joi = require('joi');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').required(),
  category: Joi.string().required(),
  description: Joi.string().optional(),
  date: Joi.date().required(),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').optional(),
  category: Joi.string().optional(),
  description: Joi.string().optional(),
  date: Joi.date().optional(),
});

const filterRecordsSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  category: Joi.string().optional(),
  type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  filterRecordsSchema,
};

