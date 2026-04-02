const { query } = require('../config/database');

class Feedback {
    static async findAll({ page = 1, limit = 20, status = '' }) {
        let whereClause = '1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const offset = (page - 1) * limit;

        const [feedbacks, total] = await Promise.all([
            query(`
                SELECT f.*, u.full_name as user_name, u.email as user_email, u.avatar_url as user_avatar,
                       admin.full_name as replied_by_name
                FROM Feedback f
                LEFT JOIN Users u ON f.user_id = u.id
                LEFT JOIN Users admin ON f.replied_by = admin.id
                WHERE ${whereClause}
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, limit, offset]),
            query(`SELECT COUNT(*) as total FROM Feedback WHERE ${whereClause}`, params)
        ]);

        return {
            feedbacks: feedbacks,
            total: total[0].total,
            page,
            totalPages: Math.ceil(total[0].total / limit)
        };
    }

    static async findById(id) {
        const result = await query(`
            SELECT f.*, u.full_name as user_name, u.email as user_email, u.avatar_url as user_avatar,
                   admin.full_name as replied_by_name
            FROM Feedback f
            LEFT JOIN Users u ON f.user_id = u.id
            LEFT JOIN Users admin ON f.replied_by = admin.id
            WHERE f.id = ?
        `, [id]);
        return result[0];
    }

    static async create({ user_id, subject, content }) {
        const result = await query(`
            INSERT INTO Feedback (user_id, subject, content, status, created_at, updated_at)
            VALUES (?, ?, ?, 'pending', NOW(), NOW())
        `, [user_id, subject, content]);

        // Get created feedback
        const feedback = await query('SELECT * FROM Feedback WHERE id = ?', [result.insertId]);
        return feedback[0];
    }

    static async update(id, { admin_reply, status, replied_by }) {
        await query(`
            UPDATE Feedback 
            SET admin_reply = ?, status = ?, replied_by = ?, 
                replied_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `, [admin_reply, status, replied_by, id]);

        // Get updated feedback
        const result = await query('SELECT * FROM Feedback WHERE id = ?', [id]);
        return result[0];
    }

    static async count({ status = '' }) {
        let whereClause = '1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const result = await query(`SELECT COUNT(*) as total FROM Feedback WHERE ${whereClause}`, params);
        return result[0].total;
    }
}

module.exports = Feedback;
