const { EventReminder } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');

const getPendingNotifications = catchAsync(async (req, res) => {
    const { type = 'popup' } = req.query;

    const reminders = await EventReminder.getPendingForUser(req.user.userId, type);

    success(res, reminders);
});

const markAsSent = catchAsync(async (req, res) => {
    const { id } = req.params;

    await EventReminder.markAsSent(id);

    success(res, null, 'Đã đánh dấu thông báo');
});

module.exports = {
    getPendingNotifications,
    markAsSent
};
