const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.isOperational) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Du lieu khong hop le',
            errors: err.details
        });
    }

    res.status(500).json({
        success: false,
        message: 'Loi he thong'
    });
};

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = { errorHandler, AppError, catchAsync };
