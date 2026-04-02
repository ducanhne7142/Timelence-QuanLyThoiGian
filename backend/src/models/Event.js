const { query } = require('../config/database');

class Event {
    static async create({
        schedule_id,
        user_id,
        category_id,
        title,
        description = '',
        start_time,
        end_time,
        all_day = false,
        color = null,
        location = ''
    }) {
        const result = await query(
            `INSERT INTO Events (schedule_id, user_id, category_id, title, description, start_time, end_time, all_day, color, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [schedule_id, user_id, category_id, title, description, start_time, end_time, all_day, color, location]
        );

        // Get created event
        const event = await query('SELECT * FROM Events WHERE id = ?', [result.insertId]);
        return event[0];
    }

    static async findById(id) {
        const result = await query(
            `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM Events e
       LEFT JOIN ActivityCategories c ON e.category_id = c.id
       WHERE e.id = ?`,
            [id]
        );
        return result[0];
    }

    static async findByUserId(userId, { startDate, endDate, categoryId, scheduleId } = {}) {
        let whereClause = 'e.user_id = ?';
        const params = [userId];

        if (startDate) {
            whereClause += ' AND e.start_time >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND e.start_time <= ?';
            params.push(endDate);
        }

        if (categoryId) {
            whereClause += ' AND e.category_id = ?';
            params.push(categoryId);
        }

        if (scheduleId) {
            whereClause += ' AND e.schedule_id = ?';
            params.push(scheduleId);
        }

        const result = await query(
            `SELECT e.*, 
       c.name as category_name, c.color as category_color, c.icon as category_icon,
       s.title as schedule_title
       FROM Events e
       LEFT JOIN ActivityCategories c ON e.category_id = c.id
       LEFT JOIN Schedules s ON e.schedule_id = s.id
       WHERE ${whereClause}
       ORDER BY e.start_time ASC`,
            params
        );

        // Get reminders for each event
        for (let event of result) {
            const reminders = await query(
                'SELECT * FROM EventReminders WHERE event_id = ?',
                [event.id]
            );
            event.reminders = reminders;
        }

        return result;
    }

    static async findByScheduleId(scheduleId) {
        const result = await query(
            `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM Events e
       LEFT JOIN ActivityCategories c ON e.category_id = c.id
       WHERE e.schedule_id = ?
       ORDER BY e.start_time ASC`,
            [scheduleId]
        );
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const params = [];

        const allowedFields = [
            'title', 'description', 'start_time', 'end_time',
            'all_day', 'category_id', 'color', 'location'
        ];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                params.push(data[field]);
            }
        });

        if (fields.length === 0) return null;

        fields.push('updated_at = NOW()');
        params.push(id);

        await query(
            `UPDATE Events SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated event
        const result = await query('SELECT * FROM Events WHERE id = ?', [id]);
        return result[0];
    }

    static async updatePosition(id, { start_time, end_time }) {
        await query(
            `UPDATE Events SET start_time = ?, end_time = ?, updated_at = NOW() WHERE id = ?`,
            [start_time, end_time, id]
        );

        // Get updated event
        const result = await query('SELECT * FROM Events WHERE id = ?', [id]);
        return result[0];
    }

    static async delete(id) {
        await query('DELETE FROM Events WHERE id = ?', [id]);
    }

    static async checkOwnership(id, userId) {
        const result = await query(
            'SELECT COUNT(*) as count FROM Events WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result[0].count > 0;
    }

    static async search(userId, keyword, { limit = 20 } = {}) {
        const safeLimit = parseInt(limit) || 20;
        const result = await query(
            `SELECT e.id, e.title, e.description, e.start_time, e.end_time, e.all_day,
             c.name as category_name, c.color as category_color
             FROM Events e
             LEFT JOIN ActivityCategories c ON e.category_id = c.id
             WHERE e.user_id = ?
             AND (e.title LIKE ? OR e.description LIKE ?)
             ORDER BY e.start_time DESC
             LIMIT ${safeLimit}`,
            [parseInt(userId), `%${keyword}%`, `%${keyword}%`]
        );
        return result;
    }

    static async getUpcoming(userId, { limit = 10 } = {}) {
        const safeLimit = parseInt(limit) || 10;
        const result = await query(
            `SELECT e.*, 
       c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM Events e
       LEFT JOIN ActivityCategories c ON e.category_id = c.id
       WHERE e.user_id = ? AND e.start_time > NOW()
       ORDER BY e.start_time ASC
       LIMIT ${safeLimit}`,
            [parseInt(userId)]
        );
        return result;
    }

    static async getStatsByCategory(userId) {
        const result = await query(
            `SELECT c.name, c.color, COUNT(e.id) as count
       FROM ActivityCategories c
       LEFT JOIN Events e ON c.id = e.category_id AND e.user_id = ?
       WHERE c.is_default = 1 AND c.is_active = 1
       GROUP BY c.id, c.name, c.color
       ORDER BY count DESC`,
            [userId]
        );
        return result;
    }

    static async getTodayEvents(userId) {
        const result = await query(
            `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM Events e
       LEFT JOIN ActivityCategories c ON e.category_id = c.id
       WHERE e.user_id = ? 
       AND DATE(e.start_time) = CURDATE()
       ORDER BY e.start_time ASC`,
            [userId]
        );
        return result;
    }
}

module.exports = Event;
