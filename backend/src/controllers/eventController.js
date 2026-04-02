const { Event, Schedule, ActivityCategory, UserActivityLog, EventReminder } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { catchAsync, AppError } = require('../middlewares/errorMiddleware');
const { query } = require('../config/database');

const getAllEvents = catchAsync(async (req, res) => {
    const {
        start,
        end,
        category_id,
        schedule_id,
        keyword,
        page = 1,
        limit = 50,
        sort = 'start_time',
        order = 'asc'
    } = req.query;

    const filters = {
        startDate: start,
        endDate: end,
        categoryId: category_id,
        scheduleId: schedule_id
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key =>
        filters[key] === undefined && delete filters[key]
    );

    let events;

    if (keyword) {
        // Search events
        events = await Event.search(req.user.userId, keyword, { limit: parseInt(limit) });
    } else {
        // Get events with filters
        events = await Event.findByUserId(req.user.userId, filters);
    }

    success(res, events);
});

const getEventById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
        return error(res, 'Su kien khong ton tai', 404);
    }

    // Check ownership
    const isOwner = await Event.checkOwnership(id, req.user.userId);
    if (!isOwner) {
        return error(res, 'Khong co quyen truy cap', 403);
    }

    // Get reminders
    const reminders = await query(
        'SELECT * FROM EventReminders WHERE event_id = ?',
        [id]
    );

    success(res, {
        ...event,
        reminders: reminders
    });
});

const createEvent = catchAsync(async (req, res) => {
    const {
        schedule_id,
        title,
        category_id,
        start_time,
        end_time,
        all_day = false,
        location = '',
        description = '',
        color = null,
        reminders = []
    } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
        return error(res, 'Tieu de su kien la bat buoc', 400);
    }

    if (title.length > 200) {
        return error(res, 'Tieu de toi da 200 ky tu', 400);
    }

    if (!start_time || !end_time) {
        return error(res, 'Thoi gian bat dau va ket thuc la bat buoc', 400);
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (endDate <= startDate) {
        return error(res, 'Thoi gian ket thuc phai sau thoi gian bat dau', 400);
    }

    // Check schedule ownership if provided
    if (schedule_id) {
        const isOwner = await Schedule.checkOwnership(schedule_id, req.user.userId);
        if (!isOwner) {
            return error(res, 'Khong co quyen them su kien vao thoi gian bieu nay', 403);
        }
    }

    // Validate category
    if (category_id) {
        const category = await ActivityCategory.findById(category_id);
        if (!category) {
            return error(res, 'Danh muc khong hop le', 400);
        }
    }

    // Create event
    const event = await Event.create({
        schedule_id: schedule_id || null,
        user_id: req.user.userId,
        category_id: category_id || null,
        title: title.trim(),
        description: description.trim(),
        start_time: startDate,
        end_time: endDate,
        all_day,
        color,
        location: location.trim()
    });

    // Create reminders
    if (reminders && reminders.length > 0) {
        for (const reminder of reminders) {
            if (reminder.minutes_before && reminder.type) {
                await EventReminder.create({
                    event_id: event.id,
                    reminder_type: reminder.type,
                    minutes_before: reminder.minutes_before
                });
            }
        }
    }

    // Calculate reminder times
    await EventReminder.calculateReminderTime();

    // Log activity
    await UserActivityLog.logEventCreate(
        req.user.userId,
        event.id,
        req.ip,
        req.get('User-Agent')
    );

    success(res, event, 'Tao su kien thanh cong', 201);
});

const updateEvent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership
    const isOwner = await Event.checkOwnership(id, req.user.userId);
    if (!isOwner) {
        return error(res, 'Khong co quyen chinh sua', 403);
    }

    // Validation
    if (updateData.title !== undefined) {
        if (!updateData.title.trim()) {
            return error(res, 'Tieu de su kien la bat buoc', 400);
        }
        if (updateData.title.length > 200) {
            return error(res, 'Tieu de toi da 200 ky tu', 400);
        }
        updateData.title = updateData.title.trim();
    }

    if (updateData.start_time && updateData.end_time) {
        const startDate = new Date(updateData.start_time);
        const endDate = new Date(updateData.end_time);

        if (endDate <= startDate) {
            return error(res, 'Thoi gian ket thuc phai sau thoi gian bat dau', 400);
        }
    }

    // Clean string fields
    if (updateData.description !== undefined) {
        updateData.description = updateData.description.trim();
    }
    if (updateData.location !== undefined) {
        updateData.location = updateData.location.trim();
    }

    const updatedEvent = await Event.update(id, updateData);

    if (!updatedEvent) {
        return error(res, 'Cap nhat that bai', 400);
    }

    // Update reminders if provided
    if (updateData.reminders) {
        // Delete existing reminders
        await query('DELETE FROM EventReminders WHERE event_id = ?', [id]);

        // Create new reminders
        for (const reminder of updateData.reminders) {
            if (reminder.minutes_before && reminder.type) {
                await query(
                    'INSERT INTO EventReminders (event_id, reminder_type, minutes_before) VALUES (?, ?, ?)',
                    [id, reminder.type, reminder.minutes_before]
                );
            }
        }
    }

    // Calculate reminder times
    await EventReminder.calculateReminderTime();

    // Log activity
    await UserActivityLog.logEventUpdate(
        req.user.userId,
        parseInt(id),
        req.ip,
        req.get('User-Agent')
    );

    success(res, updatedEvent, 'Cap nhat su kien thanh cong');
});

const deleteEvent = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check ownership
    const isOwner = await Event.checkOwnership(id, req.user.userId);
    if (!isOwner) {
        return error(res, 'Khong co quyen xoa', 403);
    }

    // Get event info for logging
    const event = await Event.findById(id);

    await Event.delete(id);

    // Log activity
    await UserActivityLog.logEventDelete(
        req.user.userId,
        parseInt(id),
        req.ip,
        req.get('User-Agent')
    );

    success(res, null, 'Xoa su kien thanh cong');
});

const moveEvent = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    // Check ownership
    const isOwner = await Event.checkOwnership(id, req.user.userId);
    if (!isOwner) {
        return error(res, 'Khong co quyen di chuyen', 403);
    }

    if (!start_time || !end_time) {
        return error(res, 'Thoi gian bat dau va ket thuc la bat buoc', 400);
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (endDate <= startDate) {
        return error(res, 'Thoi gian ket thuc phai sau thoi gian bat dau', 400);
    }

    const updatedEvent = await Event.updatePosition(id, {
        start_time: startDate,
        end_time: endDate
    });

    success(res, updatedEvent, 'Di chuyen su kien thanh cong');
});

const getTodayEvents = catchAsync(async (req, res) => {
    const events = await Event.getTodayEvents(req.user.userId);
    success(res, events);
});

const getUpcomingEvents = catchAsync(async (req, res) => {
    const { limit = 10 } = req.query;
    const events = await Event.getUpcoming(req.user.userId, { limit: parseInt(limit) });
    success(res, events);
});

const searchEvents = catchAsync(async (req, res) => {
    const { q: keyword, limit = 20 } = req.query;

    if (!keyword || keyword.trim().length === 0) {
        return success(res, []);
    }

    const events = await Event.search(req.user.userId, keyword.trim(), {
        limit: parseInt(limit)
    });

    console.log('Search results for keyword:', keyword, 'Results:', events.length);
    success(res, events);
});

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    getTodayEvents,
    getUpcomingEvents,
    searchEvents
};
