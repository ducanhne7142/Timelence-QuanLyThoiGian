const { query } = require('../config/database');
const crypto = require('crypto');

class SharedSchedule {
    static async create({ schedule_id, user_id, expires_at = null, is_password_protected = false, password = null }) {
        // Generate unique share token
        const share_token = crypto.randomBytes(32).toString('hex');

        // Hash password if provided
        const password_hash = password ? await require('bcryptjs').hash(password, 10) : null;

        const result = await query(
            `INSERT INTO SharedSchedules (schedule_id, user_id, share_token, expires_at, is_password_protected, password_hash) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [schedule_id, user_id, share_token, expires_at, is_password_protected, password_hash]
        );

        return {
            id: result.insertId,
            share_token,
            schedule_id,
            user_id,
            expires_at,
            is_password_protected
        };
    }

    static async findByToken(share_token) {
        console.log('Looking for share token:', share_token);

        // Debug: Check if token exists in SharedSchedules table
        const tokenCheck = await query('SELECT * FROM SharedSchedules WHERE share_token = ?', [share_token]);
        console.log('Token exists in SharedSchedules:', tokenCheck.length > 0);
        if (tokenCheck.length > 0) {
            console.log('SharedSchedule record:', tokenCheck[0]);
        }

        const result = await query(
            `SELECT ss.*, s.title, s.description, u.full_name as owner_name
             FROM SharedSchedules ss
             JOIN Schedules s ON ss.schedule_id = s.id  
             JOIN Users u ON ss.user_id = u.id
             WHERE ss.share_token = ? AND ss.is_active = 1 
             AND (ss.expires_at IS NULL OR ss.expires_at > NOW())`,
            [share_token]
        );

        console.log('JOIN query result count:', result.length);
        console.log('Found shared schedule:', result[0] || 'Not found');
        return result[0] || null;
    }

    static async findByScheduleId(schedule_id) {
        const result = await query(
            `SELECT * FROM SharedSchedules 
             WHERE schedule_id = ? AND is_active = 1
             ORDER BY created_at DESC`,
            [schedule_id]
        );

        return result;
    }

    static async findByUserId(user_id) {
        const result = await query(
            `SELECT ss.*, s.title as schedule_title
             FROM SharedSchedules ss
             JOIN Schedules s ON ss.schedule_id = s.id
             WHERE ss.user_id = ? AND ss.is_active = 1
             ORDER BY ss.created_at DESC`,
            [user_id]
        );

        return result;
    }

    static async getSharedScheduleData(share_token) {
        console.log('getSharedScheduleData called with token:', share_token);
        // Get schedule info
        const sharedSchedule = await this.findByToken(share_token);
        console.log('Found sharedSchedule:', sharedSchedule ? 'YES' : 'NO');
        if (!sharedSchedule) {
            return null;
        }

        // Get events for the schedule
        const events = await query(
            `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
             FROM Events e
             LEFT JOIN ActivityCategories c ON e.category_id = c.id
             WHERE e.schedule_id = ?
             ORDER BY e.start_time ASC`,
            [sharedSchedule.schedule_id]
        );

        return {
            schedule: {
                id: sharedSchedule.schedule_id,
                title: sharedSchedule.title,
                description: sharedSchedule.description,
                owner_name: sharedSchedule.owner_name,
                is_password_protected: sharedSchedule.is_password_protected
            },
            events
        };
    }

    static async toggleActive(id, is_active) {
        await query(
            'UPDATE SharedSchedules SET is_active = ? WHERE id = ?',
            [is_active, id]
        );
    }

    static async delete(id) {
        await query(
            'UPDATE SharedSchedules SET is_active = 0 WHERE id = ?',
            [id]
        );
    }

    static async verifyPassword(share_token, password) {
        const sharedSchedule = await this.findByToken(share_token);
        if (!sharedSchedule || !sharedSchedule.is_password_protected) {
            return false;
        }

        return await require('bcryptjs').compare(password, sharedSchedule.password_hash);
    }
}

module.exports = SharedSchedule;
