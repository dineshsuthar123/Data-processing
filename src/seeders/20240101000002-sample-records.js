/**
 * Sample seed data for testing
 * Creates sample financial records for testing dashboards and filters
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users || users.length === 0) {
      return;
    }

    const userId = users[0].id;
    const now = new Date();

    // Generate sample data for the last 6 months
    const records = [];

    // January records
    records.push({
      amount: 5000,
      type: 'INCOME',
      category: 'salary',
      description: 'Monthly salary',
      date: new Date(now.getFullYear(), 0, 15),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 1200,
      type: 'EXPENSE',
      category: 'rent',
      description: 'Apartment rent',
      date: new Date(now.getFullYear(), 0, 1),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 150,
      type: 'EXPENSE',
      category: 'groceries',
      description: 'Weekly groceries',
      date: new Date(now.getFullYear(), 0, 5),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // February records
    records.push({
      amount: 5000,
      type: 'INCOME',
      category: 'salary',
      description: 'Monthly salary',
      date: new Date(now.getFullYear(), 1, 15),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 1200,
      type: 'EXPENSE',
      category: 'rent',
      description: 'Apartment rent',
      date: new Date(now.getFullYear(), 1, 1),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 300,
      type: 'EXPENSE',
      category: 'utilities',
      description: 'Electric and water bill',
      date: new Date(now.getFullYear(), 1, 10),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // March records
    records.push({
      amount: 5000,
      type: 'INCOME',
      category: 'salary',
      description: 'Monthly salary',
      date: new Date(now.getFullYear(), 2, 15),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 1200,
      type: 'EXPENSE',
      category: 'rent',
      description: 'Apartment rent',
      date: new Date(now.getFullYear(), 2, 1),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 500,
      type: 'EXPENSE',
      category: 'entertainment',
      description: 'Movies and dining',
      date: new Date(now.getFullYear(), 2, 20),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 2000,
      type: 'INCOME',
      category: 'freelance',
      description: 'Freelance project',
      date: new Date(now.getFullYear(), 2, 25),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // April records
    records.push({
      amount: 5000,
      type: 'INCOME',
      category: 'salary',
      description: 'Monthly salary',
      date: new Date(now.getFullYear(), 3, 15),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 1200,
      type: 'EXPENSE',
      category: 'rent',
      description: 'Apartment rent',
      date: new Date(now.getFullYear(), 3, 1),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 250,
      type: 'EXPENSE',
      category: 'groceries',
      description: 'Groceries for the month',
      date: new Date(now.getFullYear(), 3, 5),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 500,
      type: 'EXPENSE',
      category: 'transport',
      description: 'Gas and car maintenance',
      date: new Date(now.getFullYear(), 3, 12),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // May records
    records.push({
      amount: 5000,
      type: 'INCOME',
      category: 'salary',
      description: 'Monthly salary',
      date: new Date(now.getFullYear(), 4, 15),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 1200,
      type: 'EXPENSE',
      category: 'rent',
      description: 'Apartment rent',
      date: new Date(now.getFullYear(), 4, 1),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 1000,
      type: 'EXPENSE',
      category: 'shopping',
      description: 'Clothing and accessories',
      date: new Date(now.getFullYear(), 4, 10),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    records.push({
      amount: 3000,
      type: 'INCOME',
      category: 'freelance',
      description: 'Freelance project payment',
      date: new Date(now.getFullYear(), 4, 25),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    await queryInterface.bulkInsert('financial_records', records);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DELETE FROM financial_records WHERE category IN (?, ?, ?, ?, ?, ?)', {
      replacements: ['salary', 'rent', 'groceries', 'utilities', 'entertainment', 'freelance'],
    });
  },
};

