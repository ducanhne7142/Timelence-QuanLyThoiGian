const Joi = require('joi');

const createScheduleSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.min': 'Ten thoi gian bieu la bat buoc',
            'string.max': 'Ten thoi gian bieu toi da 200 ky tu',
            'any.required': 'Ten thoi gian bieu la bat buoc'
        }),
    description: Joi.string()
        .max(1000)
        .allow('')
        .messages({
            'string.max': 'Mo ta toi da 1000 ky tu'
        }),
    start_time: Joi.date().iso(),
    end_time: Joi.date().iso(),
    is_all_day: Joi.boolean().default(false),
    location: Joi.string().max(300).allow(''),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    category_id: Joi.number().integer().positive().allow(null)
});

const updateScheduleSchema = Joi.object({
    title: Joi.string()
        .min(1)
        .max(200)
        .messages({
            'string.min': 'Ten thoi gian bieu la bat buoc',
            'string.max': 'Ten thoi gian bieu toi da 200 ky tu'
        }),
    description: Joi.string()
        .max(1000)
        .allow('')
        .messages({
            'string.max': 'Mo ta toi da 1000 ky tu'
        }),
    start_time: Joi.date().iso(),
    end_time: Joi.date().iso(),
    is_all_day: Joi.boolean(),
    location: Joi.string().max(300).allow(''),
    priority: Joi.string().valid('low', 'medium', 'high'),
    status: Joi.string().valid('planned', 'in_progress', 'completed', 'cancelled'),
    recurrence_type: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').allow(null),
    recurrence_end_date: Joi.date().iso().allow(null),
    category_id: Joi.number().integer().positive().allow(null)
});

module.exports = {
    createScheduleSchema,
    updateScheduleSchema
};
