const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, RefreshToken, PasswordResetToken } = require('../models');
const { generateAccessToken, generateRefreshToken, generateOTP } = require('../utils/tokenHelper');
const { AppError } = require('../middlewares/errorMiddleware');

const findUserByEmail = async (email) => {
    return await User.findByEmail(email);
};

const findUserById = async (id) => {
    return await User.findById(id);
};

const createUser = async ({ email, password, full_name }) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new AppError('Email đã được sử dụng', 400);
    }

    const password_hash = await bcrypt.hash(password, 12);
    return await User.create({ email, password_hash, full_name });
};

const loginUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    if (!user) {
        throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    if (!user.is_active) {
        throw new AppError('Tài khoản đã bị khóa', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Luu refresh token vao DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.create(user.id, refreshToken, expiresAt);

    // Update last login
    await User.updateLastLogin(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            role: user.role
        },
        accessToken,
        refreshToken
    };
};

const refreshTokens = async (refreshToken) => {
    const tokenData = await RefreshToken.findByToken(refreshToken);

    if (!tokenData) {
        throw new AppError('Refresh token không hợp lệ', 401);
    }

    const payload = {
        userId: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role
    };

    const newAccessToken = generateAccessToken(payload);

    return { accessToken: newAccessToken };
};

const logoutUser = async (userId, refreshToken) => {
    await RefreshToken.revokeByUserIdAndToken(userId, refreshToken);
};

const createPasswordResetToken = async (email) => {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new AppError('Email không tồn tại', 404);
    }

    const otp = generateOTP();
    const token = uuidv4();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await PasswordResetToken.create(user.id, token, otp, expiresAt);

    return { otp, token, user };
};

const verifyOTP = async (email, otp) => {
    const tokenData = await PasswordResetToken.findByEmailAndOTP(email, otp);

    if (!tokenData) {
        throw new AppError('OTP không hợp lệ hoặc hết hạn', 400);
    }

    return tokenData;
};

const resetPassword = async (email, otp, newPassword) => {
    const tokenData = await verifyOTP(email, otp);

    const password_hash = await bcrypt.hash(newPassword, 12);

    await User.update(tokenData.user_id, { password_hash });
    await PasswordResetToken.markAsUsed(tokenData.id);

    // Revoke all refresh tokens
    await RefreshToken.revokeByUserId(tokenData.user_id);
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    loginUser,
    refreshTokens,
    logoutUser,
    createPasswordResetToken,
    verifyOTP,
    resetPassword
};
