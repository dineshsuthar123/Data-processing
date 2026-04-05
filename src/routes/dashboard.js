const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get financial summary
router.get('/summary', dashboardController.getSummary);

// Get trends
router.get('/trends', dashboardController.getTrends);

// Get category breakdown
router.get('/category-breakdown', dashboardController.getCategoryBreakdown);

// Get recent transactions
router.get('/recent-transactions', dashboardController.getRecentTransactions);

module.exports = router;

