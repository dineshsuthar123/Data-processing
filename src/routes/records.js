const express = require('express');
const recordController = require('../controllers/recordController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// All record routes require authentication
router.use(authenticate);

// Create record - requires canCreateRecords permission
router.post('/', authorize('canCreateRecords'), recordController.createRecord);

// Get all records
router.get('/', recordController.getRecords);

// Get single record
router.get('/:id', recordController.getRecord);

// Update record - requires canUpdateRecords permission
router.patch('/:id', authorize('canUpdateRecords'), recordController.updateRecord);

// Delete record - requires canDeleteRecords permission
router.delete('/:id', authorize('canDeleteRecords'), recordController.deleteRecord);

module.exports = router;

