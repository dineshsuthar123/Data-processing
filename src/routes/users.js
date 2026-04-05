const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// All user routes require authentication and admin permission
router.use(authenticate);
router.use(authorize('canManageUsers'));

// Get all users
router.get('/', userController.getUsers);

// Create user
router.post('/', userController.createUser);

// Get user by ID
router.get('/:id', userController.getUser);

// Update user
router.patch('/:id', userController.updateUser);

// Update user role
router.patch('/:id/role', userController.updateUserRole);

// Deactivate user
router.delete('/:id', userController.deleteUser);

module.exports = router;

