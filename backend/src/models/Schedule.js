const { query } = require('../config/database');

class Schedule {
    static async create({
        user_id,
        title,
        description = '',
        start_time,
        end_time,
        is_all_day = false,
        location = null,
        priority = 'medium',
        status = 'planned',
        recurrence_type = null,
        recurrence_end_date = null,
        category_id = null
    }) {
        const result = await query(
            `INSERT INTO Schedules (
                user_id, title, description, start_time, end_time, is_all_day, 
                location, priority, status, recurrence_type, recurrence_end_date, category_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id, title, description, start_time, end_time, is_all_day,
                location, priority, status, recurrence_type, recurrence_end_date, category_id
            ]
        );

        // Get the created record
        const created = await query(
            'SELECT * FROM Schedules WHERE id = ?',
            [result.insertId]
        );
        return created[0];
    }

    static async findById(id) {
        const result = await query(
            'SELECT * FROM Schedules WHERE id = ?',
            [id]
        );
        return result[0];
    }

    static async findByUserId(userId) {
        const result = await query(
            'SELECT * FROM Schedules WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return result;
    }


    static async update(id, {
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
    }) {
        const fields = [];
        const params = [];

        if (title !== undefined) {
            fields.push('title = ?');
            params.push(title);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            params.push(description);
        }
        if (start_time !== undefined) {
            fields.push('start_time = ?');
            params.push(start_time);
        }
        if (end_time !== undefined) {
            fields.push('end_time = ?');
            params.push(end_time);
        }
        if (is_all_day !== undefined) {
            fields.push('is_all_day = ?');
            params.push(is_all_day);
        }
        if (location !== undefined) {
            fields.push('location = ?');
            params.push(location);
        }
        if (priority !== undefined) {
            fields.push('priority = ?');
            params.push(priority);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            params.push(status);
        }
        if (recurrence_type !== undefined) {
            fields.push('recurrence_type = ?');
            params.push(recurrence_type);
        }
        if (recurrence_end_date !== undefined) {
            fields.push('recurrence_end_date = ?');
            params.push(recurrence_end_date);
        }
        if (category_id !== undefined) {
            fields.push('category_id = ?');
            params.push(category_id);
        }

        if (fields.length === 0) return null;

        params.push(id); // Add id at the end for WHERE clause

        await query(
            `UPDATE Schedules SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        // Get the updated record
        const updated = await query(
            'SELECT * FROM Schedules WHERE id = ?',
            [id]
        );
        return updated[0];
    }

    static async delete(id) {
        await query('DELETE FROM Schedules WHERE id = ?', [id]);
    }

    static async checkOwnership(id, userId) {
        const result = await query(
            'SELECT COUNT(*) as count FROM Schedules WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result[0].count > 0;
    }

    static async getWithEventCount(userId) {
        const result = await query(
            `SELECT s.*, 
                (SELECT COUNT(*) FROM Events e WHERE e.schedule_id = s.id) as event_count
            FROM Schedules s 
            WHERE s.user_id = ? 
            ORDER BY s.created_at DESC`,
            [userId]
        );
        return result;
    }
}

module.exports = Schedule;
