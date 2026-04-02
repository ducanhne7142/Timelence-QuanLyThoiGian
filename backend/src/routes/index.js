const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const eventRoutes = require('./eventRoutes');
const categoryRoutes = require('./categoryRoutes');
const publicRoutes = require('./publicRoutes');
const notificationRoutes = require('./notificationRoutes');
const exportRoutes = require('./exportRoutes');
const adminRoutes = require('./adminRoutes');
const reminderRoutes = require('./reminderRoutes');
const shareRoutes = require('./shareRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const aiRoutes = require('./aiRoutes');
const integrationRoutes = require('./integrationRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/events', eventRoutes);
router.use('/categories', categoryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/export', exportRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
router.use('/reminders', reminderRoutes);
router.use('/shares', shareRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/ai', aiRoutes);
router.use('/integration', integrationRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
