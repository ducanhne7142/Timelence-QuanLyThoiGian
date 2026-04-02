const { query } = require('../config/database');

class RefreshToken {
    static async create(userId, token, expiresAt) {
        await query(
            'INSERT INTO RefreshTokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
    }

    static async findByToken(token) {
        const result = await query(
            `SELECT rt.*, u.email, u.role, u.is_active
       FROM RefreshTokens rt 
       JOIN Users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.is_revoked = 0 AND rt.expires_at > NOW()`,
            [token]
        );
        return result[0];
    }

    static async revokeByUserId(userId) {
        await query(
            'UPDATE RefreshTokens SET is_revoked = 1 WHERE user_id = ?',
            [userId]
        );
    }

    static async revokeByToken(token) {
        await query(
            'UPDATE RefreshTokens SET is_revoked = 1 WHERE token = ?',
            [token]
        );
    }

    static async revokeByUserIdAndToken(userId, token) {
        await query(
            'UPDATE RefreshTokens SET is_revoked = 1 WHERE user_id = ? AND token = ?',
            [userId, token]
        );
    }

    static async cleanupExpired() {
        await query(
            'DELETE FROM RefreshTokens WHERE expires_at < NOW() OR is_revoked = 1'
        );
    }
}

module.exports = RefreshToken;
