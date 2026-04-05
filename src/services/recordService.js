const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { canAccessRecord } = require('../utils/permissions');

/**
 * Create a financial record
 */
const createRecord = async (userId, data) => {
  const record = await db.FinancialRecord.create({
    ...data,
    userId,
  });

  return record;
};

/**
 * Get all financial records with role-based filtering
 */
const getRecords = async (userId, userRole, filters = {}) => {
  const where = { deletedAt: null };
  const { startDate, endDate, category, type, page = 1, limit = 20 } = filters;

  // Apply filters
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = new Date(startDate);
    if (endDate) where.date[Op.lte] = new Date(endDate);
  }

  if (category) where.category = category;
  if (type) where.type = type;

  // Role-based filtering
  if (userRole === 'VIEWER') {
    where.userId = userId;
  }
  // ANALYST and ADMIN can see all records

  const offset = (page - 1) * limit;

  const { count, rows } = await db.FinancialRecord.findAndCountAll({
    where,
    include: [{ model: db.User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }],
    order: [['date', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return {
    records: rows,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(count / limit),
  };
};

/**
 * Get single record
 */
const getRecord = async (recordId, userId, userRole) => {
  const record = await db.FinancialRecord.findByPk(recordId, {
    include: [{ model: db.User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }],
  });

  if (!record) {
    throw new NotFoundError('Record not found');
  }

  // Check access
  if (!canAccessRecord(userRole, record.userId, userId)) {
    throw new ForbiddenError('You do not have access to this record');
  }

  return record;
};

/**
 * Update financial record
 */
const updateRecord = async (recordId, userId, userRole, data) => {
  const record = await db.FinancialRecord.findByPk(recordId);

  if (!record) {
    throw new NotFoundError('Record not found');
  }

  // Check access
  if (!canAccessRecord(userRole, record.userId, userId)) {
    throw new ForbiddenError('You do not have access to this record');
  }

  await record.update(data);
  return record;
};

/**
 * Delete financial record (soft delete)
 */
const deleteRecord = async (recordId, userId, userRole) => {
  const record = await db.FinancialRecord.findByPk(recordId);

  if (!record) {
    throw new NotFoundError('Record not found');
  }

  // Check access
  if (!canAccessRecord(userRole, record.userId, userId)) {
    throw new ForbiddenError('You do not have access to this record');
  }

  await record.destroy();
  return { message: 'Record deleted successfully' };
};

module.exports = {
  createRecord,
  getRecords,
  getRecord,
  updateRecord,
  deleteRecord,
};

