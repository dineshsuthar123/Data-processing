const dashboardService = require('../services/dashboardService');

/**
 * Get financial summary
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(req.user.id, req.user.role);

    res.status(200).json({
      message: 'Summary retrieved successfully',
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trends
 */
const getTrends = async (req, res, next) => {
  try {
    const { months = 12 } = req.query;
    const trends = await dashboardService.getTrends(req.user.id, req.user.role, parseInt(months));

    res.status(200).json({
      message: 'Trends retrieved successfully',
      trends,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category breakdown
 */
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await dashboardService.getCategoryBreakdown(req.user.id, req.user.role);

    res.status(200).json({
      message: 'Category breakdown retrieved successfully',
      breakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent transactions
 */
const getRecentTransactions = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const transactions = await dashboardService.getRecentTransactions(
      req.user.id,
      req.user.role,
      parseInt(limit)
    );

    res.status(200).json({
      message: 'Recent transactions retrieved successfully',
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecentTransactions,
};

