const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const {
    updateProfileSchema,
    changePasswordSchema,
    notificationSettingsSchema
} = require('../validations/userValidation');

// All user routes require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard/stats', userController.getDashboardStats);
router.get('/dashboard/upcoming-events', userController.getUpcomingEvents);

// Profile management
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.post('/avatar', userController.uploadAvatar);

// Password management
router.put('/change-password', validate(changePasswordSchema), userController.changePassword);

// Activity logs
router.get('/activity-logs', userController.getActivityLogs);

// Notification settings
router.get('/notification-settings', userController.getNotificationSettings);
router.put('/notification-settings', validate(notificationSettingsSchema), userController.updateNotificationSettings);

module.exports = router;
