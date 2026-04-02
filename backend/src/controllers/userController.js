const bcrypt = require('bcryptjs');
const multer = require('multer');
const { User, UserActivityLog, RefreshToken } = require('../models');
const Event = require('../models/Event');
const { success, error } = require('../utils/responseHelper');
const { catchAsync, AppError } = require('../middlewares/errorMiddleware');
const { query } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// Multer config for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Chi cho phep upload file anh', 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const getProfile = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (!user) {
        return error(res, 'Nguoi dung khong ton tai', 404);
    }

    success(res, user);
});

const updateProfile = catchAsync(async (req, res) => {
    const { full_name, bio } = req.body;

    if (!full_name || full_name.trim().length < 2) {
        return error(res, 'Ho ten it nhat 2 ky tu', 400);
    }

    if (bio && bio.length > 500) {
        return error(res, 'Gioi thieu toi da 500 ky tu', 400);
    }

    const updatedUser = await User.update(req.user.userId, {
        full_name: full_name.trim(),
        bio: bio ? bio.trim() : null
    });

    if (!updatedUser) {
        return error(res, 'Cap nhat that bai', 400);
    }

    // Log activity
    await UserActivityLog.logProfileUpdate(
        req.user.userId,
        req.ip,
        req.get('User-Agent')
    );

    success(res, updatedUser, 'Cap nhat ho so thanh cong');
});

const uploadAvatar = catchAsync(async (req, res) => {
    const uploadSingle = upload.single('avatar');

    uploadSingle(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return error(res, 'File qua lon. Gioi han 2MB', 400);
                }
            }
            return error(res, err.message, 400);
        }

        if (!req.file) {
            return error(res, 'Vui long chon file anh', 400);
        }

        try {
            // Get current user to delete old avatar from Cloudinary
            const currentUser = await User.findById(req.user.userId);

            // Upload to Cloudinary
            const result = await uploadToCloudinary(req.file.buffer, {
                public_id: `avatar-${req.user.userId}-${Date.now()}`
            });

            const avatarUrl = result.secure_url;

            // Update user with new avatar URL
            const updatedUser = await User.update(req.user.userId, {
                avatar_url: avatarUrl
            });

            // Delete old avatar from Cloudinary if exists
            if (currentUser?.avatar_url) {
                const oldPublicId = getPublicIdFromUrl(currentUser.avatar_url);
                if (oldPublicId) {
                    await deleteFromCloudinary(oldPublicId);
                }
            }

            success(res, { avatar_url: avatarUrl }, 'Upload avatar thanh cong');
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return error(res, 'Upload that bai. Vui long thu lai', 500);
        }
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return error(res, 'Vui long nhap day du thong tin', 400);
    }

    if (newPassword.length < 8) {
        return error(res, 'Mat khau moi it nhat 8 ky tu', 400);
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
        return error(res, 'Mat khau can co chu hoa, chu thuong va so', 400);
    }

    // Get current user
    const currentUser = await User.findByEmail(req.user.email);
    if (!currentUser) {
        return error(res, 'Nguoi dung khong ton tai', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password_hash);
    if (!isCurrentPasswordValid) {
        return error(res, 'Mat khau hien tai khong dung', 400);
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, currentUser.password_hash);
    if (isSamePassword) {
        return error(res, 'Mat khau moi phai khac mat khau cu', 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.update(req.user.userId, {
        password_hash: newPasswordHash
    });

    // Revoke all refresh tokens (force re-login)
    await RefreshToken.revokeByUserId(req.user.userId);

    // Log activity
    await UserActivityLog.logPasswordChange(
        req.user.userId,
        req.ip,
        req.get('User-Agent')
    );

    success(res, null, 'Doi mat khau thanh cong. Vui long dang nhap lai');
});

const getActivityLogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, action = '', from = '', to = '' } = req.query;

    const filters = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    if (action) filters.action = action;
    if (from) filters.from = from;
    if (to) filters.to = to;

    const result = await UserActivityLog.findByUserId(req.user.userId, filters);

    success(res, result);
});

const getNotificationSettings = catchAsync(async (req, res) => {
    const result = await query(
        'SELECT * FROM NotificationSettings WHERE user_id = @userId',
        { userId: req.user.userId }
    );

    let settings = result.recordset[0];

    // Create default settings if not exists
    if (!settings) {
        await query(
            'INSERT INTO NotificationSettings (user_id) VALUES (@userId)',
            { userId: req.user.userId }
        );

        settings = {
            user_id: req.user.userId,
            email_enabled: true,
            popup_enabled: true,
            default_reminder_minutes: 15
        };
    }

    success(res, settings);
});

const updateNotificationSettings = catchAsync(async (req, res) => {
    const { email_enabled, popup_enabled, default_reminder_minutes } = req.body;

    const updates = {};
    if (email_enabled !== undefined) updates.email_enabled = email_enabled;
    if (popup_enabled !== undefined) updates.popup_enabled = popup_enabled;
    if (default_reminder_minutes !== undefined) {
        if (![5, 15, 30, 60].includes(default_reminder_minutes)) {
            return error(res, 'Thoi gian nhac khong hop le', 400);
        }
        updates.default_reminder_minutes = default_reminder_minutes;
    }

    if (Object.keys(updates).length === 0) {
        return error(res, 'Khong co thong tin de cap nhat', 400);
    }

    // Check if settings exist
    const existing = await query(
        'SELECT id FROM NotificationSettings WHERE user_id = @userId',
        { userId: req.user.userId }
    );

    if (existing.recordset.length === 0) {
        // Create new
        await query(
            `INSERT INTO NotificationSettings (user_id, email_enabled, popup_enabled, default_reminder_minutes) 
       VALUES (@userId, @email_enabled, @popup_enabled, @default_reminder_minutes)`,
            {
                userId: req.user.userId,
                email_enabled: updates.email_enabled ?? true,
                popup_enabled: updates.popup_enabled ?? true,
                default_reminder_minutes: updates.default_reminder_minutes ?? 15
            }
        );
    } else {
        // Update existing
        const fields = Object.keys(updates).map(key => `${key} = @${key}`);
        await query(
            `UPDATE NotificationSettings SET ${fields.join(', ')}, updated_at = GETDATE() WHERE user_id = @userId`,
            { ...updates, userId: req.user.userId }
        );
    }

    success(res, null, 'Cap nhat cai dat thanh cong');
});

// Dashboard stats for user
const getDashboardStats = catchAsync(async (req, res) => {
    const userId = req.user.userId;

    // Events today
    const todayResult = await query(
        `SELECT COUNT(*) as count FROM Schedules 
         WHERE user_id = ? AND DATE(start_time) = CURDATE()`,
        [userId]
    );
    const eventsToday = todayResult[0].count;

    // Events this week
    const weekResult = await query(
        `SELECT COUNT(*) as count FROM Schedules 
         WHERE user_id = ? 
         AND start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND start_time < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)`,
        [userId]
    );
    const eventsThisWeek = weekResult[0].count;

    // Total events
    const totalResult = await query(
        'SELECT COUNT(*) as count FROM Schedules WHERE user_id = ?',
        [userId]
    );
    const totalEvents = totalResult[0].count;

    // Completed events (past events)
    const completedResult = await query(
        `SELECT COUNT(*) as count FROM Schedules 
         WHERE user_id = ? AND end_time < NOW()`,
        [userId]
    );
    const completedEvents = completedResult[0].count;

    // Completion rate
    const completionRate = totalEvents > 0
        ? Math.round((completedEvents / totalEvents) * 100)
        : 0;

    success(res, {
        eventsToday,
        eventsThisWeek,
        completionRate,
        totalEvents
    });
});

// Upcoming events for user dashboard
const getUpcomingEvents = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 5;

    // Use Event.getUpcoming method instead of direct query
    const events = await Event.getUpcoming(userId, { limit });

    success(res, events);
});

module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    getActivityLogs,
    getNotificationSettings,
    updateNotificationSettings,
    getDashboardStats,
    getUpcomingEvents
};
