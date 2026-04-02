const { v4: uuidv4 } = require('uuid');
const { Schedule, Event, UserActivityLog } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { catchAsync, AppError } = require('../middlewares/errorMiddleware');
const { formatDateForMySQL } = require('../utils/dateHelper');

const getAllSchedules = catchAsync(async (req, res) => {
    const schedules = await Schedule.getWithEventCount(req.user.userId);
    success(res, schedules);
});

const getScheduleById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
        return error(res, 'Thoi gian bieu khong ton tai', 404);
    }

    // Check ownership
    if (schedule.user_id !== req.user.userId) {
        return error(res, 'Khong co quyen truy cap', 403);
    }

    success(res, schedule);
});

const createSchedule = catchAsync(async (req, res) => {
    const {
        title,
        description = '',
        start_time,
        end_time,
        is_all_day = false,
        location = null,
        priority = 'medium',
        category_id = null
    } = req.body;

    if (!title || title.trim().length === 0) {
        return error(res, 'Ten thoi gian bieu la bat buoc', 400);
    }

    if (title.length > 200) {
        return error(res, 'Ten thoi gian bieu toi da 200 ky tu', 400);
    }

    if (description && description.length > 1000) {
        return error(res, 'Mo ta toi da 1000 ky tu', 400);
    }

    // Provide default times if not specified
    const now = new Date();
    const defaultStartTime = start_time || now.toISOString();
    const defaultEndTime = end_time || new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour later

    const schedule = await Schedule.create({
        user_id: req.user.userId,
        title: title.trim(),
        description: description.trim(),
        start_time: formatDateForMySQL(defaultStartTime),
        end_time: formatDateForMySQL(defaultEndTime),
        is_all_day,
        location,
        priority,
        category_id
    });

    // Log activity
    try {
        await UserActivityLog.create({
            user_id: req.user.userId,
            action: 'create_schedule',
            entity_type: 'schedule',
            entity_id: schedule.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
    } catch (logError) {
        console.warn('Activity logging failed:', logError.message);
    }

    success(res, schedule, 'Tao thoi gian bieu thanh cong', 201);
});

const updateSchedule = catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        start_time,
        end_time,
        is_all_day,
        location,
        priority,
        status,
        recurrence_type,
        recurrence_end_date,
        category_id
    } = req.body;

    // Check ownership
    const isOwner = await Schedule.checkOwnership(id, req.user.userId);
    if (!isOwner) {
        return error(res, 'Khong co quyen chinh sua', 403);
    }

    const updates = {};

    if (title !== undefined) {
        if (!title.trim()) {
            return error(res, 'Ten thoi gian bieu la bat buoc', 400);
        }
        if (title.length > 200) {
            return error(res, 'Ten thoi gian bieu toi da 200 ky tu', 400);
        }
        updates.title = title.trim();
    }

    if (description !== undefined) {
        if (description.length > 1000) {
            return error(res, 'Mo ta toi da 1000 ky tu', 400);
        }
        updates.description = description.trim();
    }

    // Handle datetime fields
    if (start_time !== undefined) {
        updates.start_time = formatDateForMySQL(start_time);
    }
    if (end_time !== undefined) {
        updates.end_time = formatDateForMySQL(end_time);
    }
    if (is_all_day !== undefined) {
        updates.is_all_day = is_all_day;
    }
    if (location !== undefined) {
        updates.location = location;
    }
    if (priority !== undefined) {
        updates.priority = priority;
    }
    if (status !== undefined) {
        updates.status = status;
    }
    if (recurrence_type !== undefined) {
        updates.recurrence_type = recurrence_type;
    }
    if (recurrence_end_date !== undefined) {
        updates.recurrence_end_date = recurrence_end_date ? formatDateForMySQL(recurrence_end_date) : null;
    }
    if (category_id !== undefined) {
        updates.category_id = category_id;
    }

    const updatedSchedule = await Schedule.update(id, updates);

    if (!updatedSchedule) {
        return error(res, 'Cap nhat that bai', 400);
    }

    // Log activity
    try {
        await UserActivityLog.create({
            user_id: req.user.userId,
            action: 'update_schedule',
            entity_type: 'schedule',
            entity_id: parseInt(id),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
    } catch (logError) {
        console.warn('Activity logging failed:', logError.message);
    }

    success(res, updatedSchedule, 'Cap nhat thoi gian bieu thanh cong');
});

const deleteSchedule = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check ownership
    const isOwner = await Schedule.checkOwnership(id, req.user.userId);
    if (!isOwner) {
        return error(res, 'Khong co quyen xoa', 403);
    }

    // Get schedule info for logging
    const schedule = await Schedule.findById(id);

    await Schedule.delete(id);

    // Log activity
    await UserActivityLog.create({
        user_id: req.user.userId,
        action: 'delete_schedule',
        entity_type: 'schedule',
        entity_id: parseInt(id),
        details: JSON.stringify({ title: schedule?.title }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
    });

    success(res, null, 'Xoa thoi gian bieu thanh cong');
});

// Sharing functionality not available in current MySQL schema

module.exports = {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
};
