const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/environment');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/records', recordRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
// Error handling middleware
app.use(errorHandler);

// Initialize default roles and users
const initializeData = async () => {
  try {
    // Create default roles if they don't exist
    const roles = ['VIEWER', 'ANALYST', 'ADMIN'];
    for (const roleName of roles) {
      await db.Role.findOrCreate({ where: { name: roleName } });
    }
    console.log('Default roles initialized');

    // Create default test users if they don't exist
    const bcrypt = require('bcrypt');
    const testUsers = [
      { email: 'admin@finance.local', password: 'admin123', firstName: 'Admin', role: 'ADMIN' },
      { email: 'analyst@finance.local', password: 'admin123', firstName: 'Analyst', role: 'ANALYST' },
      { email: 'viewer@finance.local', password: 'admin123', firstName: 'Viewer', role: 'VIEWER' },
    ];

    for (const testUser of testUsers) {
      const [user, created] = await db.User.findOrCreate({
        where: { email: testUser.email },
        defaults: {
          email: testUser.email,
          password: await bcrypt.hash(testUser.password, 10),
          firstName: testUser.firstName,
          lastName: 'User',
          roleId: (await db.Role.findOne({ where: { name: testUser.role } })).id,
        },
      });
      if (created) {
        console.log(`Created test user: ${testUser.email}`);
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection established');

    // Sync database
    await db.sequelize.sync({ alter: env.NODE_ENV === 'development' });
    console.log('Database synced');

    // Initialize default data
    await initializeData();

    // Start server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

