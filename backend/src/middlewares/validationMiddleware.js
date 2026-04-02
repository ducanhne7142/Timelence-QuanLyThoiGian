const Joi = require('joi');
const { error } = require('../utils/responseHelper');

// Password validation schema
const passwordSchema = Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số')
    .required();

// Validation schemas
const schemas = {
    register: Joi.object({
        full_name: Joi.string().min(2).max(50).required().messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 50 ký tự',
            'any.required': 'Họ tên là bắt buộc'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
        password: passwordSchema
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    event: Joi.object({
        title: Joi.string().min(1).max(200).required().messages({
            'string.min': 'Tiêu đề không được để trống',
            'string.max': 'Tiêu đề không được vượt quá 200 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
        description: Joi.string().max(1000).allow('').messages({
            'string.max': 'Mô tả không được vượt quá 1000 ký tự'
        }),
        start_time: Joi.date().iso().required().messages({
            'date.base': 'Thời gian bắt đầu không hợp lệ',
            'any.required': 'Thời gian bắt đầu là bắt buộc'
        }),
        end_time: Joi.date().iso().greater(Joi.ref('start_time')).required().messages({
            'date.base': 'Thời gian kết thúc không hợp lệ',
            'date.greater': 'Thời gian kết thúc phải sau thời gian bắt đầu',
            'any.required': 'Thời gian kết thúc là bắt buộc'
        }),
        category_id: Joi.number().integer().positive().required().messages({
            'number.base': 'Danh mục không hợp lệ',
            'number.positive': 'Danh mục không hợp lệ',
            'any.required': 'Danh mục là bắt buộc'
        }),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('').messages({
            'string.pattern.base': 'Màu sắc phải có định dạng hex (#RRGGBB)'
        }),
        location: Joi.string().max(200).allow('').messages({
            'string.max': 'Địa điểm không được vượt quá 200 ký tự'
        }),
        all_day: Joi.boolean().default(false)
    }),

    schedule: Joi.object({
        title: Joi.string().min(1).max(100).required().messages({
            'string.min': 'Tiêu đề không được để trống',
            'string.max': 'Tiêu đề không được vượt quá 100 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
        description: Joi.string().max(500).allow('').messages({
            'string.max': 'Mô tả không được vượt quá 500 ký tự'
        }),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow('').messages({
            'string.pattern.base': 'Màu sắc phải có định dạng hex (#RRGGBB)'
        })
    }),

    category: Joi.object({
        name: Joi.string().min(1).max(50).required().messages({
            'string.min': 'Tên danh mục không được để trống',
            'string.max': 'Tên danh mục không được vượt quá 50 ký tự',
            'any.required': 'Tên danh mục là bắt buộc'
        }),
        name_vi: Joi.string().min(1).max(50).required().messages({
            'string.min': 'Tên tiếng Việt không được để trống',
            'string.max': 'Tên tiếng Việt không được vượt quá 50 ký tự',
            'any.required': 'Tên tiếng Việt là bắt buộc'
        }),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required().messages({
            'string.pattern.base': 'Màu sắc phải có định dạng hex (#RRGGBB)',
            'any.required': 'Màu sắc là bắt buộc'
        }),
        icon: Joi.string().max(50).allow('').messages({
            'string.max': 'Tên icon không được vượt quá 50 ký tự'
        }),
        is_active: Joi.boolean().default(true)
    }),

    feedback: Joi.object({
        subject: Joi.string().min(1).max(200).required().messages({
            'string.min': 'Chủ đề không được để trống',
            'string.max': 'Chủ đề không được vượt quá 200 ký tự',
            'any.required': 'Chủ đề là bắt buộc'
        }),
        content: Joi.string().min(20).max(2000).required().messages({
            'string.min': 'Nội dung phải có ít nhất 20 ký tự',
            'string.max': 'Nội dung không được vượt quá 2000 ký tự',
            'any.required': 'Nội dung là bắt buộc'
        })
    }),

    updateProfile: Joi.object({
        name: Joi.string().min(2).max(50).messages({
            'string.min': 'Tên phải có ít nhất 2 ký tự',
            'string.max': 'Tên không được vượt quá 50 ký tự'
        }),
        bio: Joi.string().max(500).allow('').messages({
            'string.max': 'Giới thiệu không được vượt quá 500 ký tự'
        })
    }),

    changePassword: Joi.object({
        current_password: Joi.string().required().messages({
            'any.required': 'Mật khẩu hiện tại là bắt buộc'
        }),
        new_password: passwordSchema
    }),

    resetPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    confirmResetPassword: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required(),
        newPassword: passwordSchema
    })
};

// Validation middleware factory
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            return error(res, 'Schema validation không tồn tại', 500);
        }

        const { error: validationError, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationError) {
            const errors = validationError.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return error(res, 'Dữ liệu không hợp lệ', 400, { validation_errors: errors });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

// Sanitization helpers
const sanitize = {
    // Remove HTML tags and trim whitespace
    text: (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/<[^>]*>/g, '').trim();
    },

    // Escape HTML special characters
    html: (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Sanitize email
    email: (email) => {
        if (typeof email !== 'string') return email;
        return email.toLowerCase().trim();
    }
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }

        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
            return sanitized;
        }

        if (typeof obj === 'string') {
            return sanitize.text(obj);
        }

        return obj;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize email specifically
    if (req.body && req.body.email) {
        req.body.email = sanitize.email(req.body.email);
    }

    next();
};

module.exports = {
    validate,
    sanitize,
    sanitizeInput,
    passwordSchema
};
