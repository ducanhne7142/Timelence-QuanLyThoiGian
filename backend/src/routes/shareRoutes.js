const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const shareController = require('../controllers/shareController');

// Public endpoint to get shared schedule
router.post('/shared/:token', shareController.getSharedSchedule);

// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Share routes working' });
});

// Protected routes require authentication
router.use(authenticate);

// Create share link
router.post('/', shareController.createShare);

// Get user's shared schedules
router.get('/', shareController.getUserShares);

// Toggle share status
router.patch('/:id/toggle', shareController.toggleShare);

// Delete share link
router.delete('/:id', shareController.deleteShare);

module.exports = router;
