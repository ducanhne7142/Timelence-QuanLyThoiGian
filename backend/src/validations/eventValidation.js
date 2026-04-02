const Joi = require('joi');

const reminderSchema = Joi.object({
    type: Joi.string()
        .valid('email', 'popup', 'both')
        .required(),
    minutes_before: Joi.number()
        .integer()
        .min(0)
        .max(10080) // 1 week
        .required()
});

const createEventSchema = Joi.object({
    schedule_id: Joi.number().integer().positive().allow(null),
    title: Joi.string()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.min': 'Tieu de su kien la bat buoc',
            'string.max': 'Tieu de toi da 200 ky tu',
            'any.required': 'Tieu de su kien la bat buoc'
        }),
    category_id: Joi.number().integer().positive().allow(null),
    start_time: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': 'Thoi gian bat dau khong hop le',
            'any.required': 'Thoi gian bat dau la bat buoc'
        }),
    end_time: Joi.date()
        .iso()
        .greater(Joi.ref('start_time'))
        .required()
        .messages({
            'date.base': 'Thoi gian ket thuc khong hop le',
            'date.greater': 'Thoi gian ket thuc phai sau thoi gian bat dau',
            'any.required': 'Thoi gian ket thuc la bat buoc'
        }),
    all_day: Joi.boolean().default(false),
    location: Joi.string()
        .max(300)
        .allow('')
        .messages({
            'string.max': 'Dia diem toi da 300 ky tu'
        }),
    description: Joi.string()
        .max(1000)
        .allow('')
        .messages({
            'string.max': 'Mo ta toi da 1000 ky tu'
        }),
    color: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .allow(null)
        .messages({
            'string.pattern.base': 'Mau sac phai la ma hex hop le (vi du: #FF0000)'
        }),
    reminders: Joi.array().items(reminderSchema).default([])
});

const updateEventSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(200)
        .messages({
            'string.min': 'Tieu de su kien la bat buoc',
            'string.max': 'Tieu de toi da 200 ky tu'
        }),
    schedule_id: Joi.number().integer().positive().allow(null),
    category_id: Joi.number().integer().positive().allow(null),
    start_time: Joi.date().iso(),
    end_time: Joi.date().iso(),
    all_day: Joi.boolean(),
    location: Joi.string()
        .max(300)
        .allow('')
        .messages({
            'string.max': 'Dia diem toi da 300 ky tu'
        }),
    description: Joi.string()
        .max(1000)
        .allow('')
        .messages({
            'string.max': 'Mo ta toi da 1000 ky tu'
        }),
    color: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .allow(null)
        .messages({
            'string.pattern.base': 'Mau sac phai la ma hex hop le (vi du: #FF0000)'
        }),
    reminders: Joi.array().items(reminderSchema)
}).custom((value, helpers) => {
    if (value.start_time && value.end_time) {
        const start = new Date(value.start_time);
        const end = new Date(value.end_time);
        if (end <= start) {
            return helpers.error('custom.endTimeAfterStart');
        }
    }
    return value;
}).messages({
    'custom.endTimeAfterStart': 'Thoi gian ket thuc phai sau thoi gian bat dau'
});

const moveEventSchema = Joi.object({
    start_time: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': 'Thoi gian bat dau khong hop le',
            'any.required': 'Thoi gian bat dau la bat buoc'
        }),
    end_time: Joi.date()
        .iso()
        .greater(Joi.ref('start_time'))
        .required()
        .messages({
            'date.base': 'Thoi gian ket thuc khong hop le',
            'date.greater': 'Thoi gian ket thuc phai sau thoi gian bat dau',
            'any.required': 'Thoi gian ket thuc la bat buoc'
        })
});

module.exports = {
    createEventSchema,
    updateEventSchema,
    moveEventSchema
};
