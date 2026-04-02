const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');
const authService = require('../services/authService');
const emailService = require('../services/emailService');

const register = catchAsync(async (req, res) => {
    const { email, password, full_name } = req.body;

    const user = await authService.createUser({ email, password, full_name });

    // Gui email chao mung (khong can await)
    emailService.sendWelcomeEmail(email, full_name).catch(console.error);

    success(res, user, 'Dang ky thanh cong', 201);
});

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    // Set refresh token vao cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    success(res, {
        user: result.user,
        accessToken: result.accessToken
    }, 'Dang nhap thanh cong');
});

const logout = catchAsync(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken && req.user) {
        await authService.logoutUser(req.user.userId, refreshToken);
    }

    res.clearCookie('refreshToken');
    success(res, null, 'Dang xuat thanh cong');
});

const refreshToken = catchAsync(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
        return error(res, 'Refresh token khong ton tai', 401);
    }

    const result = await authService.refreshTokens(token);

    success(res, result, 'Token da duoc lam moi');
});

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const { otp, user } = await authService.createPasswordResetToken(email);

    // Gui email OTP
    await emailService.sendOTPEmail(email, otp, user.full_name);

    success(res, null, 'Ma OTP da duoc gui den email cua ban');
});

const verifyOTP = catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    await authService.verifyOTP(email, otp);

    success(res, null, 'OTP hop le');
});

const resetPassword = catchAsync(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    await authService.resetPassword(email, otp, newPassword);

    success(res, null, 'Mat khau da duoc cap nhat');
});

const getProfile = catchAsync(async (req, res) => {
    const user = await authService.findUserById(req.user.userId);

    if (!user) {
        return error(res, 'Nguoi dung khong ton tai', 404);
    }

    success(res, user);
});

module.exports = {
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    verifyOTP,
    resetPassword,
    getProfile
};
