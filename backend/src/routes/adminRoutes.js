const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', adminController.getStats);
router.get('/charts/users', adminController.getUserGrowthChart);
router.get('/charts/events-by-category', adminController.getEventsByCategoryChart);
router.get('/recent-activities', adminController.getRecentActivity);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.delete('/users/:id', adminController.deleteUser);

// Category management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Feedback management
router.get('/feedbacks', adminController.getFeedbacks);
router.get('/feedbacks/:id', adminController.getFeedbackDetails);
router.put('/feedbacks/:id/status', adminController.updateFeedbackStatus);
router.post('/feedbacks/:id/reply', adminController.replyToFeedback);
router.delete('/feedbacks/:id', adminController.deleteFeedback);

module.exports = router;
