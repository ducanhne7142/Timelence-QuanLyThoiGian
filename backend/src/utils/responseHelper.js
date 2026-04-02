const success = (res, data = null, message = 'Thanh cong', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const error = (res, message = 'Co loi xay ra', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };
    if (errors) {
        response.errors = errors;
    }
    return res.status(statusCode).json(response);
};

const paginate = (res, data, pagination, message = 'Thanh cong') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination
    });
};

module.exports = { success, error, paginate };
