const { error } = require('../utils/responseHelper');

const validate = (schema) => {
    return (req, res, next) => {
        const { error: validationError } = schema.validate(req.body, {
            abortEarly: false
        });

        if (validationError) {
            console.log('Validation Error:', validationError.details);
            console.log('Request body:', req.body);
            const errors = validationError.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return error(res, 'Du lieu khong hop le', 400, errors);
        }

        next();
    };
};

module.exports = { validate };
