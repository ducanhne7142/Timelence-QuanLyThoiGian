const Joi = require('joi');

const updateProfileSchema = Joi.object({
    full_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Ho ten it nhat 2 ky tu',
            'string.max': 'Ho ten toi da 100 ky tu',
            'any.required': 'Ho ten la bat buoc'
        }),
    bio: Joi.string()
        .max(500)
        .allow('')
        .messages({
            'string.max': 'Gioi thieu toi da 500 ky tu'
        })
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Mat khau hien tai la bat buoc'
        }),
    newPassword: Joi.string()
        .min(8)
        .pattern(/[A-Z]/, 'uppercase')
        .pattern(/[a-z]/, 'lowercase')
        .pattern(/[0-9]/, 'number')
        .required()
        .messages({
            'string.min': 'Mat khau moi it nhat 8 ky tu',
            'string.pattern.name': 'Mat khau can co chu hoa, chu thuong va so',
            'any.required': 'Mat khau moi la bat buoc'
        })
});

const notificationSettingsSchema = Joi.object({
    email_enabled: Joi.boolean(),
    popup_enabled: Joi.boolean(),
    default_reminder_minutes: Joi.number()
        .valid(5, 15, 30, 60)
        .messages({
            'any.only': 'Thoi gian nhac phai la 5, 15, 30 hoac 60 phut'
        })
});

module.exports = {
    updateProfileSchema,
    changePasswordSchema,
    notificationSettingsSchema
};
