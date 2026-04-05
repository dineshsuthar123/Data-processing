const recordService = require('../services/recordService');
const { createRecordSchema, updateRecordSchema, filterRecordsSchema } = require('../validators/recordValidator');

/**
 * Create financial record
 */
const createRecord = async (req, res, next) => {
  try {
    const { error, value } = createRecordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const record = await recordService.createRecord(req.user.id, value);

    res.status(201).json({
      message: 'Record created successfully',
      record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all records
 */
const getRecords = async (req, res, next) => {
  try {
    const { error, value } = filterRecordsSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const data = await recordService.getRecords(req.user.id, req.user.role, value);

    res.status(200).json({
      message: 'Records retrieved successfully',
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single record
 */
const getRecord = async (req, res, next) => {
  try {
    const record = await recordService.getRecord(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      message: 'Record retrieved successfully',
      record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update record
 */
const updateRecord = async (req, res, next) => {
  try {
    const { error, value } = updateRecordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const record = await recordService.updateRecord(
      req.params.id,
      req.user.id,
      req.user.role,
      value
    );

    res.status(200).json({
      message: 'Record updated successfully',
      record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete record
 */
const deleteRecord = async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecord,
  updateRecord,
  deleteRecord,
};

