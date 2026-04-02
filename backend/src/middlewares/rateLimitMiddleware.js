const rateLimit = require('express-rate-limit');
const { error } = require('../utils/responseHelper');

// Global rate limiter - DISABLED FOR DEVELOPMENT
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 999999, // DISABLED - unlimited requests
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints - DISABLED
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 999999, // DISABLED - unlimited auth requests
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Registration rate limiter - DISABLED
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 999999, // DISABLED
    message: {
        success: false,
        message: 'Quá nhiều lần đăng ký từ IP này, vui lòng thử lại sau 1 giờ'
    }
});

// Password reset rate limiter - DISABLED
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 999999, // DISABLED
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ'
    }
});

// Create event rate limiter - DISABLED
const createEventLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 999999, // DISABLED
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user ? `user_${req.user.userId}` : req.ip;
    },
    message: {
        success: false,
        message: 'Bạn đã tạo quá nhiều sự kiện trong ngày, vui lòng thử lại vào ngày mai'
    }
});

// Feedback rate limiter - DISABLED
const feedbackLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 999999, // DISABLED
    keyGenerator: (req) => {
        return req.user ? `feedback_${req.user.userId}` : `feedback_ip_${req.ip}`;
    },
    message: {
        success: false,
        message: 'Bạn đã gửi quá nhiều phản hồi trong ngày, vui lòng thử lại vào ngày mai'
    }
});

// Search rate limiter - DISABLED
const searchLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 999999, // DISABLED
    keyGenerator: (req) => {
        return req.user ? `search_${req.user.userId}` : `search_ip_${req.ip}`;
    },
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu tìm kiếm, vui lòng thử lại sau'
    }
});

// API rate limiter - DISABLED
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 999999, // DISABLED
    keyGenerator: (req) => {
        return req.user ? `api_${req.user.userId}` : `api_ip_${req.ip}`;
    },
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu API, vui lòng thử lại sau'
    }
});

// Custom spam detection middleware - DISABLED FOR DEVELOPMENT
const antiSpam = async (req, res, next) => {
    // DISABLED - Skip all spam checks
    next();
};

// Failed login attempt tracking - DISABLED FOR DEVELOPMENT
const loginAttemptLimiter = async (req, res, next) => {
    // DISABLED - Skip all login attempt checks
    next();
};

module.exports = {
    globalLimiter,
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
    createEventLimiter,
    feedbackLimiter,
    searchLimiter,
    apiLimiter,
    antiSpam,
    loginAttemptLimiter
};
