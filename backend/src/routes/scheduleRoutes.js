const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const {
    createScheduleSchema,
    updateScheduleSchema
} = require('../validations/scheduleValidation');

// All schedule routes require authentication
router.use(authenticate);

// Schedule CRUD
router.get('/', scheduleController.getAllSchedules);
router.post('/', validate(createScheduleSchema), scheduleController.createSchedule);
router.get('/:id', scheduleController.getScheduleById);
router.put('/:id', validate(updateScheduleSchema), scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

// Share functionality not available in current MySQL schema

module.exports = router;
