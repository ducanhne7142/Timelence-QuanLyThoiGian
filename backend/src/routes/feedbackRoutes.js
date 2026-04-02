const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middlewares/authMiddleware');

// All feedback routes require authentication
router.use(authenticate);

// User feedback routes
router.post('/', feedbackController.createFeedback);
router.get('/my-feedbacks', feedbackController.getUserFeedbacks);

module.exports = router;
