const { Op } = require('sequelize');
const db = require('../models');

/**
 * Get financial summary for dashboard
 */
const getSummary = async (userId, userRole) => {
  const where = userRole === 'VIEWER' ? { userId } : {};

  const records = await db.FinancialRecord.findAll({
    where: { ...where, deletedAt: null },
  });

  let totalIncome = 0;
  let totalExpense = 0;

  records.forEach(record => {
    if (record.type === 'INCOME') {
      totalIncome += parseFloat(record.amount);
    } else if (record.type === 'EXPENSE') {
      totalExpense += parseFloat(record.amount);
    }
  });

  const netBalance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    transactionCount: records.length,
  };
};

/**
 * Get monthly trends
 */
const getTrends = async (userId, userRole, months = 12) => {
  const where = userRole === 'VIEWER' ? { userId } : {};
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const records = await db.FinancialRecord.findAll({
    where: {
      ...where,
      deletedAt: null,
      date: { [Op.gte]: startDate },
    },
    order: [['date', 'ASC']],
  });

  // Group by month
  const trends = {};

  records.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!trends[monthKey]) {
      trends[monthKey] = { income: 0, expense: 0 };
    }

    if (record.type === 'INCOME') {
      trends[monthKey].income += parseFloat(record.amount);
    } else if (record.type === 'EXPENSE') {
      trends[monthKey].expense += parseFloat(record.amount);
    }
  });

  return Object.keys(trends)
    .sort()
    .map(month => ({
      month,
      ...trends[month],
      net: trends[month].income - trends[month].expense,
    }));
};

/**
 * Get category breakdown
 */
const getCategoryBreakdown = async (userId, userRole) => {
  const where = userRole === 'VIEWER' ? { userId } : {};

  const records = await db.FinancialRecord.findAll({
    where: { ...where, deletedAt: null },
  });

  const breakdown = {};

  records.forEach(record => {
    if (!breakdown[record.category]) {
      breakdown[record.category] = { income: 0, expense: 0 };
    }

    if (record.type === 'INCOME') {
      breakdown[record.category].income += parseFloat(record.amount);
    } else if (record.type === 'EXPENSE') {
      breakdown[record.category].expense += parseFloat(record.amount);
    }
  });

  return Object.keys(breakdown).map(category => ({
    category,
    ...breakdown[category],
    total: breakdown[category].income + breakdown[category].expense,
  }));
};

/**
 * Get recent high-value transactions
 */
const getRecentTransactions = async (userId, userRole, limit = 10) => {
  const where = userRole === 'VIEWER' ? { userId } : {};

  const records = await db.FinancialRecord.findAll({
    where: { ...where, deletedAt: null },
    include: [{ model: db.User, as: 'creator', attributes: ['email', 'firstName', 'lastName'] }],
    order: [['date', 'DESC']],
    limit,
  });

  return records;
};

module.exports = {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecentTransactions,
};

