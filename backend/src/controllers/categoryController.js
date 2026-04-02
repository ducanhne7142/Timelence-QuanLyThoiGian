const { query } = require('../config/database');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');

const getAllCategories = catchAsync(async (req, res) => {
    try {
        // Get from ActivityCategories table (used for Events)
        const categories = await query(
            'SELECT id, name, name_vi, color, icon FROM ActivityCategories WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
        );
        success(res, categories);
    } catch (dbError) {
        // Fallback to default categories if table doesn't exist
        const defaultCategories = [
            { id: 1, name: 'Study', name_vi: 'Học tập', color: '#3B82F6', icon: '📚' },
            { id: 2, name: 'Work', name_vi: 'Làm việc', color: '#EF4444', icon: '💼' },
            { id: 3, name: 'Exercise', name_vi: 'Thể dục', color: '#10B981', icon: '🏃' },
            { id: 4, name: 'Meal', name_vi: 'Ăn uống', color: '#F59E0B', icon: '🍽️' },
            { id: 5, name: 'Sleep', name_vi: 'Nghỉ ngơi', color: '#8B5CF6', icon: '😴' },
            { id: 6, name: 'Entertainment', name_vi: 'Giải trí', color: '#EC4899', icon: '🎮' },
            { id: 7, name: 'Meeting', name_vi: 'Họp', color: '#06B6D4', icon: '👥' },
            { id: 8, name: 'Other', name_vi: 'Khác', color: '#6B7280', icon: '📋' }
        ];
        success(res, defaultCategories);
    }
});

const getCategoryById = catchAsync(async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('SELECT * FROM ActivityCategories WHERE id = ?', [id]);
        if (!result[0]) {
            return error(res, 'Danh muc khong ton tai', 404);
        }
        success(res, result[0]);
    } catch (dbError) {
        return error(res, 'Danh muc khong ton tai', 404);
    }
});

module.exports = {
    getAllCategories,
    getCategoryById
};
