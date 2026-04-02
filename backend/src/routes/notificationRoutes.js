const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');

// All notification routes require authentication
router.use(authenticate);

router.get('/pending', notificationController.getPendingNotifications);
router.post('/:id/mark-sent', notificationController.markAsSent);

module.exports = router;
