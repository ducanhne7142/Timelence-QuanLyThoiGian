const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticate } = require('../middlewares/authMiddleware');

// All export routes require authentication
router.use(authenticate);

router.get('/events', exportController.exportEvents);

module.exports = router;
