const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');
const SharedSchedule = require('../models/SharedSchedule');
const Schedule = require('../models/Schedule');

const shareController = {
    // Create new share link
    createShare: catchAsync(async (req, res) => {
        const { schedule_id, expires_at, is_password_protected, password } = req.body;
        const user_id = req.user.userId;

        // Verify user owns the schedule
        const schedule = await Schedule.findById(schedule_id);
        if (!schedule || schedule.user_id !== user_id) {
            return error(res, 'Không tìm thấy thời gian biểu', 404);
        }

        // Check if share link already exists
        const existingShares = await SharedSchedule.findByScheduleId(schedule_id);
        if (existingShares.length > 0) {
            return error(res, 'Thời gian biểu này đã được chia sẻ', 400);
        }

        console.log('Creating share link for schedule:', schedule_id, 'user:', user_id);
        const sharedSchedule = await SharedSchedule.create({
            schedule_id,
            user_id,
            expires_at: expires_at || null,
            is_password_protected: is_password_protected || false,
            password: password || null
        });

        console.log('Created shared schedule:', sharedSchedule);
        success(res, {
            id: sharedSchedule.id,
            share_token: sharedSchedule.share_token,
            share_url: `${process.env.FRONTEND_URL}/shared/${sharedSchedule.share_token}`,
            expires_at: sharedSchedule.expires_at,
            is_password_protected: sharedSchedule.is_password_protected
        }, 'Tạo link chia sẻ thành công', 201);
    }),

    // Get user's shared schedules
    getUserShares: catchAsync(async (req, res) => {
        const user_id = req.user.userId;
        const shares = await SharedSchedule.findByUserId(user_id);

        const sharesWithUrls = shares.map(share => ({
            ...share,
            share_url: `${process.env.FRONTEND_URL}/shared/${share.share_token}`
        }));

        success(res, sharesWithUrls);
    }),

    // Get shared schedule data (public endpoint)
    getSharedSchedule: catchAsync(async (req, res) => {
        console.log('getSharedSchedule called with token:', req.params.token);
        const { token } = req.params;
        const { password } = req.body;

        const scheduleData = await SharedSchedule.getSharedScheduleData(token);
        console.log('Schedule data found:', !!scheduleData);
        if (!scheduleData) {
            return error(res, 'Link chia sẻ không tồn tại hoặc đã hết hạn', 404);
        }

        // Check password if required
        if (scheduleData.schedule.is_password_protected) {
            if (!password) {
                return error(res, 'Yêu cầu mật khẩu', 401);
            }

            const isPasswordValid = await SharedSchedule.verifyPassword(token, password);
            if (!isPasswordValid) {
                return error(res, 'Mật khẩu không đúng', 401);
            }
        }

        success(res, scheduleData);
    }),

    // Toggle share active status
    toggleShare: catchAsync(async (req, res) => {
        const { id } = req.params;
        const { is_active } = req.body;
        const user_id = req.user.userId;

        // Verify ownership
        const shares = await SharedSchedule.findByUserId(user_id);
        const share = shares.find(s => s.id === parseInt(id));

        if (!share) {
            return error(res, 'Không tìm thấy link chia sẻ', 404);
        }

        await SharedSchedule.toggleActive(id, is_active);
        success(res, null, 'Cập nhật trạng thái chia sẻ thành công');
    }),

    // Delete share link
    deleteShare: catchAsync(async (req, res) => {
        const { id } = req.params;
        const user_id = req.user.userId;

        // Verify ownership
        const shares = await SharedSchedule.findByUserId(user_id);
        const share = shares.find(s => s.id === parseInt(id));

        if (!share) {
            return error(res, 'Không tìm thấy link chia sẻ', 404);
        }

        await SharedSchedule.delete(id);
        success(res, null, 'Xóa link chia sẻ thành công');
    })
};

module.exports = shareController;
