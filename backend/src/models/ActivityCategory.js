const { query } = require('../config/database');

class ActivityCategory {
    static async getAll() {
        const result = await query(
            'SELECT * FROM ActivityCategories WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
        );
        return result;
    }

    static async findById(id) {
        const result = await query(
            'SELECT * FROM ActivityCategories WHERE id = ?',
            [id]
        );
        return result[0];
    }

    static async create({ name, name_vi, color, icon, created_by = null }) {
        const result = await query(
            `INSERT INTO ActivityCategories (name, name_vi, color, icon, created_by) VALUES (?, ?, ?, ?, ?)`,
            [name, name_vi, color, icon, created_by]
        );

        // Get the created record
        const created = await query(
            'SELECT * FROM ActivityCategories WHERE id = ?',
            [result.insertId]
        );
        return created[0];
    }

    static async update(id, { name, name_vi, color, icon, is_active }) {
        const fields = [];
        const params = [];

        if (name !== undefined) {
            fields.push('name = ?');
            params.push(name);
        }
        if (name_vi !== undefined) {
            fields.push('name_vi = ?');
            params.push(name_vi);
        }
        if (color !== undefined) {
            fields.push('color = ?');
            params.push(color);
        }
        if (icon !== undefined) {
            fields.push('icon = ?');
            params.push(icon);
        }
        if (is_active !== undefined) {
            fields.push('is_active = ?');
            params.push(is_active);
        }

        if (fields.length === 0) return null;

        fields.push('updated_at = NOW()');
        params.push(id); // Add id at the end for WHERE clause

        await query(
            `UPDATE ActivityCategories SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        // Get the updated record
        const updated = await query(
            'SELECT * FROM ActivityCategories WHERE id = ?',
            [id]
        );
        return updated[0];
    }

    static async delete(id) {
        // Check if it's a default category
        const category = await this.findById(id);
        if (category && category.is_default) {
            throw new Error('Khong the xoa danh muc mac dinh');
        }

        await query('DELETE FROM ActivityCategories WHERE id = ?', [id]);
    }

    static async getDefaults() {
        const result = await query(
            'SELECT * FROM ActivityCategories WHERE is_default = 1 ORDER BY name ASC'
        );
        return result;
    }
}

module.exports = ActivityCategory;
