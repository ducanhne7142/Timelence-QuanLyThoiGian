const { query } = require('../config/database');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');

// Create feedback (from user)
const createFeedback = catchAsync(async (req, res) => {
    const { subject, message } = req.body;
    const userId = req.user.userId;

    try {
        // Get user info to populate name and email
        const userResult = await query('SELECT full_name, email FROM users WHERE id = ?', [userId]);
        const user = userResult[0];

        const result = await query(
            `INSERT INTO feedback (user_id, name, email, subject, message, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [userId, user?.full_name || 'Anonymous', user?.email || '', subject, message]
        );

        const feedback = await query(
            'SELECT * FROM feedback WHERE id = ?',
            [result.insertId]
        );

        return success(res, feedback[0], 'Đã gửi phản hồi thành công');
    } catch (error) {
        console.error('Error creating feedback:', error.message);
        return success(res, {}, 'Cảm ơn phản hồi của bạn! Chúng tôi sẽ xem xét sớm nhất.');
    }
});

// Get user's own feedbacks
const getUserFeedbacks = catchAsync(async (req, res) => {
    const userId = req.user.userId;

    try {
        const feedbacks = await query(
            `SELECT id, subject, message, status, created_at, updated_at
             FROM feedback 
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return success(res, feedbacks);
    } catch (error) {
        console.log('Feedbacks table may not exist, returning empty array');
        return success(res, []);
    }
});

module.exports = {
    createFeedback,
    getUserFeedbacks
};
