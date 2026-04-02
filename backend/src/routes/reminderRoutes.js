const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');
const EventReminder = require('../models/EventReminder');
const reminderService = require('../services/reminderService');

// Fix reminder times (for development) - NO AUTH for testing
router.post('/fix-times-dev', catchAsync(async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return error(res, 'Chỉ khả dụng trong môi trường phát triển', 403);
    }

    await EventReminder.calculateReminderTime();

    success(res, null, 'Đã tính toán lại thời gian nhắc nhở');
}));

// All other routes require authentication
router.use(authenticate);

// Get pending reminders for current user
router.get('/pending', catchAsync(async (req, res) => {
    const { type } = req.query; // 'email', 'popup', or null for all

    const reminders = await EventReminder.getPendingForUser(req.user.userId, type);

    success(res, reminders);
}));

// Get recent notifications (sent in last 24 hours)
router.get('/recent', catchAsync(async (req, res) => {
    const reminders = await EventReminder.getRecentForUser(req.user.userId);

    success(res, reminders);
}));

// Manually trigger reminder processing (for testing)
router.post('/process', catchAsync(async (req, res) => {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return error(res, 'Chỉ khả dụng trong môi trường phát triển', 403);
    }

    await reminderService.processReminders();

    success(res, null, 'Xử lý nhắc nhở thành công');
}));

// Get reminder service status
router.get('/status', catchAsync(async (req, res) => {
    const status = reminderService.getStatus();

    success(res, status);
}));

// Get all reminders for an event
router.get('/event/:eventId', catchAsync(async (req, res) => {
    const { eventId } = req.params;

    const reminders = await EventReminder.findByEventId(eventId);

    success(res, reminders);
}));

// Fix reminder times (for development)
router.post('/fix-times', catchAsync(async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return error(res, 'Chỉ khả dụng trong môi trường phát triển', 403);
    }

    await EventReminder.calculateReminderTime();

    success(res, null, 'Đã tính toán lại thời gian nhắc nhở');
}));

module.exports = router;
