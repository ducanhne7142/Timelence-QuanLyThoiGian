const { query } = require('../config/database');

class PasswordResetToken {
    static async create(userId, token, otpCode, expiresAt) {
        await query(
            'INSERT INTO PasswordResetTokens (user_id, token, otp_code, expires_at) VALUES (?, ?, ?, ?)',
            [userId, token, otpCode, expiresAt]
        );
    }

    static async findByEmailAndOTP(email, otp) {
        const result = await query(
            `SELECT prt.*, u.full_name, u.email
       FROM PasswordResetTokens prt
       JOIN Users u ON prt.user_id = u.id
       WHERE u.email = ? AND prt.otp_code = ? 
       AND prt.is_used = 0 AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC`,
            [email, otp]
        );
        return result[0];
    }

    static async markAsUsed(id) {
        await query(
            'UPDATE PasswordResetTokens SET is_used = 1 WHERE id = ?',
            [id]
        );
    }

    static async countRecentByUserId(userId, hours = 1) {
        const result = await query(
            `SELECT COUNT(*) as count 
       FROM PasswordResetTokens 
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
            [userId, hours]
        );
        return result[0].count;
    }

    static async cleanupExpired() {
        await query(
            'DELETE FROM PasswordResetTokens WHERE expires_at < NOW() OR is_used = 1'
        );
    }
}

module.exports = PasswordResetToken;
