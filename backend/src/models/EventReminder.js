const { query } = require('../config/database');

class EventReminder {
    static async create({ event_id, reminder_type, minutes_before }) {
        const result = await query(
            `INSERT INTO EventReminders (event_id, reminder_type, minutes_before) VALUES (?, ?, ?)`,
            [event_id, reminder_type, minutes_before]
        );

        // Get the created record
        const created = await query(
            'SELECT * FROM EventReminders WHERE id = ?',
            [result.insertId]
        );

        return created[0];
    }

    static async findByEventId(eventId) {
        const result = await query(
            'SELECT * FROM EventReminders WHERE event_id = ?',
            [eventId]
        );
        return result;
    }

    static async getPendingReminders(reminderType = null) {
        let whereClause = `
      er.is_sent = 0 
      AND er.reminder_time <= NOW()
      AND e.start_time > NOW()
    `;
        const params = [];

        if (reminderType) {
            whereClause += ` AND (er.reminder_type = ? OR er.reminder_type = 'both')`;
            params.push(reminderType);
        }

        const result = await query(
            `SELECT 
        er.id as reminder_id,
        er.event_id,
        er.reminder_type,
        er.minutes_before,
        er.reminder_time,
        e.title,
        e.description,
        e.location,
        e.start_time,
        e.end_time,
        e.all_day,
        u.id as user_id,
        u.full_name,
        u.email
       FROM EventReminders er
       JOIN Events e ON er.event_id = e.id
       JOIN Users u ON e.user_id = u.id
       WHERE ${whereClause}
       ORDER BY er.reminder_time ASC`,
            params
        );
        return result;
    }

    static async markAsSent(reminderId) {
        await query(
            'UPDATE EventReminders SET is_sent = 1, sent_at = NOW() WHERE id = ?',
            [reminderId]
        );
    }

    static async deleteByEventId(eventId) {
        await query(
            'DELETE FROM EventReminders WHERE event_id = ?',
            [eventId]
        );
    }

    static async calculateReminderTime() {
        // Calculate reminder_time for all reminders that don't have it set
        await query(`
            UPDATE EventReminders er
            JOIN Events e ON er.event_id = e.id
            SET er.reminder_time = DATE_SUB(e.start_time, INTERVAL er.minutes_before MINUTE)
            WHERE er.reminder_time IS NULL
        `);
    }

    static async getPendingForUser(userId, reminderType = null) {
        let whereClause = `
      er.is_sent = 0 
      AND er.reminder_time <= NOW()
      AND e.start_time > NOW()
      AND e.user_id = ?
    `;
        const params = [userId];

        if (reminderType) {
            whereClause += ` AND (er.reminder_type = ? OR er.reminder_type = 'both')`;
            params.push(reminderType);
        }

        const result = await query(
            `SELECT 
        er.id as reminder_id,
        er.event_id,
        er.reminder_type,
        er.minutes_before,
        er.reminder_time,
        e.title,
        e.description,
        e.location,
        e.start_time,
        e.end_time,
        e.all_day
       FROM EventReminders er
       JOIN Events e ON er.event_id = e.id
       WHERE ${whereClause}
       ORDER BY er.reminder_time ASC`,
            params
        );
        return result;
    }

    static async getRecentForUser(userId) {
        const result = await query(
            `SELECT 
        er.id as reminder_id,
        er.event_id,
        er.reminder_type,
        er.minutes_before,
        er.reminder_time,
        er.sent_at,
        e.title,
        e.description,
        e.location,
        e.start_time,
        e.end_time,
        e.all_day
       FROM EventReminders er
       JOIN Events e ON er.event_id = e.id
       WHERE er.is_sent = 1 
         AND e.user_id = ?
         AND er.sent_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND e.start_time > NOW()
       ORDER BY er.sent_at DESC`,
            [userId]
        );
        return result;
    }
}

module.exports = EventReminder;
