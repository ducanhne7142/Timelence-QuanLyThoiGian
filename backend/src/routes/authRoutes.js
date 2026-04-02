const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, sanitizeInput } = require('../middlewares/validationMiddleware');
const {
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
    loginAttemptLimiter
} = require('../middlewares/rateLimitMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');

// Apply sanitization to all routes
router.use(sanitizeInput);

router.post('/register',
    registerLimiter,
    validate('register'),
    authController.register
);

router.post('/login',
    authLimiter,
    loginAttemptLimiter,
    validate('login'),
    authController.login
);

router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

router.post('/forgot-password',
    passwordResetLimiter,
    validate('resetPassword'),
    authController.forgotPassword
);

router.post('/verify-otp',
    authLimiter,
    authController.verifyOTP
);

router.post('/reset-password',
    passwordResetLimiter,
    validate('confirmResetPassword'),
    authController.resetPassword
);

router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
