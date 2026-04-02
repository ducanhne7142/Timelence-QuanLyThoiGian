const { verifyAccessToken } = require('../utils/tokenHelper');
const { error } = require('../utils/responseHelper');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, 'Token khong hop le', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return error(res, 'Token da het han', 401);
        }
        return error(res, 'Token khong hop le', 401);
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, 'Chua xac thuc', 401);
        }

        if (!roles.includes(req.user.role)) {
            return error(res, 'Khong co quyen truy cap', 403);
        }

        next();
    };
};

module.exports = { authenticate, authorize };
