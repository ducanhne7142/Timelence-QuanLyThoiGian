const { query } = require('../config/database');

class UserActivityLog {
    static async create({
        user_id,
        action,
        entity_type = null,
        entity_id = null,
        details = null,
        ip_address = null,
        user_agent = null
    }) {
        await query(
            `INSERT INTO UserActivityLogs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, action, entity_type, entity_id, details, ip_address, user_agent]
        );
    }

    static async findByUserId(userId, { page = 1, limit = 20, action = '' } = {}) {
        let whereClause = 'user_id = ?';
        const params = [userId];
        const countParams = [userId];

        if (action) {
            whereClause += ' AND action = ?';
            params.push(action);
            countParams.push(action);
        }

        const safeLimit = parseInt(limit) || 20;
        const safePage = parseInt(page) || 1;
        const offset = (safePage - 1) * safeLimit;

        const [logs, total] = await Promise.all([
            query(
                `SELECT * FROM UserActivityLogs 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${offset}, ${safeLimit}`,
                params
            ),
            query(
                `SELECT COUNT(*) as total FROM UserActivityLogs WHERE ${whereClause}`,
                countParams
            )
        ]);

        return {
            logs: logs,
            total: total[0].total,
            page: safePage,
            totalPages: Math.ceil(total[0].total / safeLimit)
        };
    }

    static async getRecentActivities({ limit = 10 } = {}) {
        const safeLimit = parseInt(limit) || 10;
        const result = await query(
            `SELECT l.*, u.full_name, u.email
       FROM UserActivityLogs l
       JOIN Users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT ${safeLimit}`
        );
        return result;
    }

    static async cleanup(daysToKeep = 90) {
        await query(
            'DELETE FROM UserActivityLogs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [daysToKeep]
        );
    }

    // Helper methods for common actions
    static async logLogin(userId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'login',
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }

    static async logLogout(userId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'logout',
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }

    static async logProfileUpdate(userId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'update_profile',
            entity_type: 'profile',
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }

    static async logPasswordChange(userId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'change_password',
            entity_type: 'profile',
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }

    static async logEventCreate(userId, eventId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'create_event',
            entity_type: 'event',
            entity_id: eventId,
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }

    static async logEventUpdate(userId, eventId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'update_event',
            entity_type: 'event',
            entity_id: eventId,
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }

    static async logEventDelete(userId, eventId, ipAddress, userAgent) {
        await this.create({
            user_id: userId,
            action: 'delete_event',
            entity_type: 'event',
            entity_id: eventId,
            ip_address: ipAddress,
            user_agent: userAgent
        });
    }
}

module.exports = UserActivityLog;
