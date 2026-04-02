const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const {
    createEventSchema,
    updateEventSchema,
    moveEventSchema
} = require('../validations/eventValidation');

// All event routes require authentication
router.use(authenticate);

// Event CRUD
router.get('/', eventController.getAllEvents);
router.get('/search', eventController.searchEvents);
router.post('/', validate(createEventSchema), eventController.createEvent);
router.get('/today', eventController.getTodayEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', validate(updateEventSchema), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Drag & Drop
router.patch('/:id/move', validate(moveEventSchema), eventController.moveEvent);

module.exports = router;
