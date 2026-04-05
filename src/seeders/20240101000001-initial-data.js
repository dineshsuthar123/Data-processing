'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, create roles
    await queryInterface.bulkInsert('roles', [
      {
        name: 'VIEWER',
        description: 'Can only view dashboard summaries',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'ANALYST',
        description: 'Can view records and create insights',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'ADMIN',
        description: 'Full system access',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Then, create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@finance.local',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        active: true,
        roleId: 3, // ADMIN
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'analyst@finance.local',
        password: hashedPassword,
        firstName: 'Analyst',
        lastName: 'User',
        active: true,
        roleId: 2, // ANALYST
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'viewer@finance.local',
        password: hashedPassword,
        firstName: 'Viewer',
        lastName: 'User',
        active: true,
        roleId: 1, // VIEWER
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  },
};

