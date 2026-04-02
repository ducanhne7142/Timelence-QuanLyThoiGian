const { query } = require('../config/database');

class User {
    static async findById(id) {
        const result = await query(
            'SELECT id, email, full_name, avatar_url, bio, role, is_active, created_at, updated_at, last_login_at FROM Users WHERE id = ?',
            [id]
        );
        return result[0];
    }

    static async findByEmail(email) {
        const result = await query(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );
        return result[0];
    }

    static async create({ email, password_hash, full_name }) {
        const result = await query(
            `INSERT INTO Users (email, password_hash, full_name) VALUES (?, ?, ?)`,
            [email, password_hash, full_name]
        );

        // Get the created user
        const user = await query(
            'SELECT id, email, full_name, role, created_at FROM Users WHERE id = ?',
            [result.insertId]
        );
        return user[0];
    }

    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.full_name !== undefined) {
            fields.push('full_name = ?');
            params.push(data.full_name);
        }
        if (data.avatar_url !== undefined) {
            fields.push('avatar_url = ?');
            params.push(data.avatar_url);
        }
        if (data.bio !== undefined) {
            fields.push('bio = ?');
            params.push(data.bio);
        }
        if (data.password_hash !== undefined) {
            fields.push('password_hash = ?');
            params.push(data.password_hash);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            params.push(data.is_active);
        }

        if (fields.length === 0) return null;

        fields.push('updated_at = NOW()');
        params.push(id);

        await query(
            `UPDATE Users SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated user
        const result = await query(
            'SELECT id, email, full_name, avatar_url, bio, role, updated_at FROM Users WHERE id = ?',
            [id]
        );
        return result[0];
    }

    static async updateLastLogin(id) {
        await query(
            'UPDATE Users SET last_login_at = NOW() WHERE id = ?',
            [id]
        );
    }

    static async delete(id) {
        await query('DELETE FROM Users WHERE id = ?', [id]);
    }

    static async getAll({ page = 1, limit = 20, search = '', status = '' }) {
        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (full_name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status === 'active') {
            whereClause += ' AND is_active = 1';
        } else if (status === 'inactive') {
            whereClause += ' AND is_active = 0';
        }

        const offset = (page - 1) * limit;

        const [users, total] = await Promise.all([
            query(
                `SELECT id, email, full_name, avatar_url, role, is_active, created_at, last_login_at
         FROM Users 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            ),
            query(
                `SELECT COUNT(*) as total FROM Users WHERE ${whereClause}`,
                params
            )
        ]);

        return {
            users: users,
            total: total[0].total,
            page,
            totalPages: Math.ceil(total[0].total / limit)
        };
    }

    static async getStatistics() {
        const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30_days
      FROM Users
    `);
        return result[0];
    }
}

module.exports = User;
