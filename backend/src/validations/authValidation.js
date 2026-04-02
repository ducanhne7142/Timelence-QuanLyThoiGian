const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email khong hop le',
            'any.required': 'Email la bat buoc'
        }),
    password: Joi.string()
        .min(8)
        .pattern(/[A-Z]/, 'uppercase')
        .pattern(/[a-z]/, 'lowercase')
        .pattern(/[0-9]/, 'number')
        .required()
        .messages({
            'string.min': 'Mat khau it nhat 8 ky tu',
            'string.pattern.name': 'Mat khau can co chu hoa, chu thuong va so',
            'any.required': 'Mat khau la bat buoc'
        }),
    full_name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Ho ten it nhat 2 ky tu',
            'string.max': 'Ho ten toi da 100 ky tu',
            'any.required': 'Ho ten la bat buoc'
        })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email khong hop le',
            'any.required': 'Email la bat buoc'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Mat khau la bat buoc'
        })
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email khong hop le',
            'any.required': 'Email la bat buoc'
        })
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required().messages({
        'string.length': 'OTP phai co 6 ky tu'
    })
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string()
        .min(8)
        .pattern(/[A-Z]/, 'uppercase')
        .pattern(/[a-z]/, 'lowercase')
        .pattern(/[0-9]/, 'number')
        .required()
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema
};
