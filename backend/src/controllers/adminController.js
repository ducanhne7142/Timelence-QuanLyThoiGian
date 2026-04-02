const { query } = require('../config/database');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/email');

// Generate random password
const generateRandomPassword = (length = 10) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Get dashboard statistics (simplified)
const getStats = catchAsync(async (req, res) => {
    // Total users
    const totalUsersResult = await query(
        "SELECT COUNT(*) as count FROM Users WHERE role = 'user'"
    );
    const totalUsers = totalUsersResult[0].count;

    // Total schedules
    const totalSchedulesResult = await query(
        "SELECT COUNT(*) as count FROM Schedules"
    );
    const totalSchedules = totalSchedulesResult[0].count;

    // Active users (with schedules)
    const activeUsersResult = await query(
        "SELECT COUNT(DISTINCT user_id) as count FROM Schedules"
    );
    const activeUsers = activeUsersResult[0].count;

    return success(res, {
        totalUsers,
        totalSchedules,
        activeUsers,
        pendingFeedbacks: 0, // Placeholder
        userGrowth: 0,
        eventGrowth: 0
    });
});

// Get all users with pagination and filters  
const getUsers = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereClause = "WHERE role = 'user'";
    let params = [];

    if (search) {
        whereClause += " AND (full_name LIKE ? OR email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status === 'active') {
        whereClause += " AND is_active = 1";
    } else if (status === 'locked') {
        whereClause += " AND is_active = 0";
    }

    // Get total count
    const countResult = await query(
        `SELECT COUNT(*) as total FROM Users ${whereClause}`,
        params
    );
    const count = countResult[0].total;

    // Get users with pagination - use string concatenation for LIMIT/OFFSET
    const safeLimit = parseInt(limit);
    const safeOffset = parseInt(offset);
    console.log('Query params:', params, 'LIMIT:', safeLimit, 'OFFSET:', safeOffset);

    const users = await query(
        `SELECT id, email, full_name, avatar_url, bio, role, is_active, created_at, updated_at, last_login_at 
         FROM Users ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        params
    );

    // Add additional info for each user
    for (const user of users) {
        // Count schedules
        const scheduleCountResult = await query(
            'SELECT COUNT(*) as count FROM Schedules WHERE user_id = ?',
            [user.id]
        );
        const scheduleCount = scheduleCountResult[0].count;

        user.schedule_count = scheduleCount;
        user.event_count = 0; // Placeholder
    }

    return success(res, {
        users,
        pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit)
        }
    });
});

// Toggle user status (activate/deactivate)
const toggleUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    // Validate required parameters
    if (!id || id === 'undefined') {
        return error(res, 'User ID is required', 400);
    }

    // Validate user ID is a valid number
    const userId = parseInt(id);
    if (isNaN(userId) || userId <= 0) {
        return error(res, 'Invalid user ID format', 400);
    }

    if (typeof is_active !== 'boolean') {
        return error(res, 'is_active must be a boolean value', 400);
    }

    // Update user status
    await query(
        'UPDATE Users SET is_active = ?, updated_at = NOW() WHERE id = ? AND role = "user"',
        [is_active ? 1 : 0, userId]
    );

    // Get updated user
    const updatedUser = await query(
        'SELECT id, email, full_name, is_active FROM Users WHERE id = ?',
        [userId]
    );

    if (!updatedUser[0]) {
        return error(res, 'User not found', 404);
    }

    return success(res, updatedUser[0], `User ${is_active ? 'activated' : 'deactivated'} successfully`);
});

// Get user details
const getUserDetails = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Validate user ID
    if (!id || id === 'undefined') {
        return error(res, 'User ID is required', 400);
    }

    const userId = parseInt(id);
    if (isNaN(userId) || userId <= 0) {
        return error(res, 'Invalid user ID format', 400);
    }

    // Get user info
    const users = await query(
        'SELECT id, email, full_name, avatar_url, bio, role, is_active, created_at, updated_at, last_login_at FROM Users WHERE id = ? AND role = "user"',
        [userId]
    );

    if (!users[0]) {
        return error(res, 'User not found', 404);
    }

    const user = users[0];

    // Get schedule count
    const scheduleCountResult = await query(
        'SELECT COUNT(*) as count FROM Schedules WHERE user_id = ?',
        [userId]
    );
    user.schedule_count = scheduleCountResult[0].count;

    // Get event count  
    const eventCountResult = await query(
        'SELECT COUNT(*) as count FROM Events WHERE user_id = ?',
        [userId]
    );
    user.event_count = eventCountResult[0].count;
    console.log('Event count for user', userId, ':', user.event_count);

    // Get recent schedules
    const recentSchedules = await query(
        'SELECT id, title, created_at FROM Schedules WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
    );
    user.recent_schedules = recentSchedules;

    return success(res, user);
});

// User registration chart - users registered per day
const getUserGrowthChart = catchAsync(async (req, res) => {
    const days = parseInt(req.query.days) || 30;

    const result = await query(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM Users 
         WHERE role = 'user' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [days]
    );

    // Fill in missing dates with 0 count
    const chartData = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = result.find(r => r.date && r.date.toISOString().split('T')[0] === dateStr);
        chartData.push({
            date: dateStr,
            count: found ? found.count : 0
        });
    }

    return success(res, chartData);
});

// Events by category chart
const getEventsByCategoryChart = catchAsync(async (req, res) => {
    const result = await query(
        `SELECT c.name, c.color, COUNT(e.id) as count
         FROM Categories c
         LEFT JOIN Events e ON c.id = e.category_id
         WHERE c.is_default = 1
         GROUP BY c.id, c.name, c.color
         HAVING count > 0
         ORDER BY count DESC`
    );

    return success(res, result);
});

// Recent activities
const getRecentActivity = catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Use string interpolation to avoid prepared statement issues
        const result = await query(
            `SELECT l.*, u.full_name as user_name, u.avatar_url as user_avatar
             FROM UserActivityLogs l
             JOIN Users u ON l.user_id = u.id
             ORDER BY l.created_at DESC
             LIMIT ${limit}`
        );

        return success(res, result);
    } catch (error) {
        console.log('UserActivityLogs table may not exist, returning empty array');
        return success(res, []);
    }
});

const getCategories = catchAsync(async (req, res) => {
    const categories = await query(
        'SELECT * FROM ActivityCategories WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
    );
    return success(res, categories);
});

const createCategory = catchAsync(async (req, res) => {
    const { name, name_vi, color, icon } = req.body;

    const result = await query(
        'INSERT INTO ActivityCategories (name, name_vi, color, icon, is_default, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [name || name_vi, name_vi || name, color, icon, 0, req.user.userId]
    );

    const created = await query(
        'SELECT * FROM ActivityCategories WHERE id = ?',
        [result.insertId]
    );

    return success(res, created[0], 'Tạo danh mục thành công');
});

const updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, name_vi, color, icon } = req.body;

    await query(
        'UPDATE ActivityCategories SET name = ?, name_vi = ?, color = ?, icon = ? WHERE id = ?',
        [name || name_vi, name_vi || name, color, icon, id]
    );

    const updated = await query(
        'SELECT * FROM ActivityCategories WHERE id = ?',
        [id]
    );

    return success(res, updated[0], 'Cập nhật danh mục thành công');
});

const deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if it's default category
    const category = await query(
        'SELECT is_default FROM ActivityCategories WHERE id = ?',
        [id]
    );

    if (category[0]?.is_default) {
        return error(res, 'Không thể xóa danh mục mặc định', 400);
    }

    await query('DELETE FROM ActivityCategories WHERE id = ?', [id]);
    return success(res, null, 'Xóa danh mục thành công');
});

const getFeedbacks = catchAsync(async (req, res) => {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (status) {
        whereClause += ' AND f.status = ?';
        params.push(status);
    }

    // Remove category filter temporarily until we know the table structure
    // if (category) {
    //     whereClause += ' AND f.category = ?';
    //     params.push(category);
    // }

    if (search) {
        whereClause += ' AND (f.subject LIKE ? OR f.message LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    try {
        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM feedback f WHERE ${whereClause}`,
            params
        );

        // Get feedbacks - use name and email from feedback table
        const feedbacks = await query(
            `SELECT f.*, f.name as user_name, f.email as user_email 
             FROM feedback f
             WHERE ${whereClause}
             ORDER BY f.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${offset}`,
            params
        );

        return success(res, {
            feedbacks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error.message);
        return success(res, { feedbacks: [], pagination: {} });
    }
});

const updateFeedbackStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    await query(
        'UPDATE feedback SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
    );

    const updated = await query('SELECT * FROM feedback WHERE id = ?', [id]);
    return success(res, updated[0], 'Đã cập nhật trạng thái');
});

const deleteFeedback = catchAsync(async (req, res) => {
    const { id } = req.params;

    await query('DELETE FROM feedback WHERE id = ?', [id]);
    return success(res, null, 'Đã xóa phản hồi');
});

// Reset user password - Admin function
const resetUserPassword = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Validate user ID
    if (!id || id === 'undefined') {
        return error(res, 'User ID is required', 400);
    }

    const userId = parseInt(id);
    if (isNaN(userId) || userId <= 0) {
        return error(res, 'Invalid user ID format', 400);
    }

    // Get user info
    const users = await query(
        'SELECT id, email, full_name, role FROM Users WHERE id = ? AND role = "user"',
        [userId]
    );

    if (!users[0]) {
        return error(res, 'Khong tim thay nguoi dung', 404);
    }

    const user = users[0];

    // Generate new random password
    const newPassword = generateRandomPassword(10);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password in database
    await query(
        'UPDATE Users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [passwordHash, userId]
    );

    // Send email with new password
    try {
        await sendEmail({
            to: user.email,
            subject: 'Mat khau moi - Schedule App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Dat lai mat khau</h2>
                    <p>Xin chao <strong>${user.full_name || 'ban'}</strong>,</p>
                    <p>Mat khau cua ban da duoc dat lai boi quan tri vien.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Mat khau moi cua ban:</strong></p>
                        <p style="font-size: 24px; color: #2563eb; margin: 10px 0; font-family: monospace;">${newPassword}</p>
                    </div>
                    <p style="color: #666;">Vui long dang nhap va doi mat khau ngay de bao mat tai khoan.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">Day la email tu dong, vui long khong tra loi email nay.</p>
                </div>
            `
        });

        return success(res, {
            email: user.email,
            message_sent: true
        }, 'Da dat lai mat khau va gui email thanh cong');
    } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Password was already changed, but email failed
        return success(res, {
            email: user.email,
            new_password: newPassword,
            message_sent: false
        }, 'Da dat lai mat khau nhung khong gui duoc email. Mat khau moi: ' + newPassword);
    }
});

// Delete user - Admin function
const deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Validate user ID
    if (!id || id === 'undefined') {
        return error(res, 'User ID is required', 400);
    }

    const userId = parseInt(id);
    if (isNaN(userId) || userId <= 0) {
        return error(res, 'Invalid user ID format', 400);
    }

    // Check if user exists and is not admin
    const users = await query(
        'SELECT id, email, full_name, role FROM Users WHERE id = ?',
        [userId]
    );

    if (!users[0]) {
        return error(res, 'Khong tim thay nguoi dung', 404);
    }

    if (users[0].role === 'admin') {
        return error(res, 'Khong the xoa tai khoan admin', 403);
    }

    const user = users[0];

    // Delete related data first (foreign key constraints)
    // Delete events
    await query('DELETE FROM Events WHERE user_id = ?', [userId]);

    // Delete schedules
    await query('DELETE FROM Schedules WHERE user_id = ?', [userId]);

    // Delete refresh tokens
    await query('DELETE FROM RefreshTokens WHERE user_id = ?', [userId]);

    // Delete password reset tokens
    await query('DELETE FROM PasswordResetTokens WHERE user_id = ?', [userId]);

    // Delete shared schedules (if exists)
    try {
        await query('DELETE FROM SharedSchedules WHERE user_id = ? OR shared_with_user_id = ?', [userId, userId]);
    } catch (e) {
        // Table may not exist
    }

    // Finally delete the user
    await query('DELETE FROM Users WHERE id = ?', [userId]);

    return success(res, {
        deleted_user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name
        }
    }, 'Da xoa nguoi dung thanh cong');
});

const getFeedbackDetails = catchAsync(async (req, res) => {
    return success(res, {}, 'Feature not implemented yet');
});

const replyToFeedback = catchAsync(async (req, res) => {
    return success(res, {}, 'Feature not implemented yet');
});

module.exports = {
    getStats,
    getUserGrowthChart,
    getEventsByCategoryChart,
    getRecentActivity,
    getUsers,
    getUserDetails,
    toggleUserStatus,
    resetUserPassword,
    deleteUser,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getFeedbacks,
    getFeedbackDetails,
    replyToFeedback,
    updateFeedbackStatus,
    deleteFeedback
};
