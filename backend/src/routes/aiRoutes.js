const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/priority', aiController.analyzePriority);
router.get('/suggest-schedule', aiController.suggestSchedule);
router.post('/chat', aiController.chatAI);

module.exports = router;