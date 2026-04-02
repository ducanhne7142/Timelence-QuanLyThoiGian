const { catchAsync } = require('../middlewares/errorMiddleware');
const { success, error } = require('../utils/responseHelper');
const Event = require('../models/Event');
const aiService = require('../services/aiService');

const analyzePriority = catchAsync(async (req, res) => {
    const userId = req.user.userId || req.user.id || req.user.user_id;
    const events = await Event.findByUserId(userId);
    
    const result = await aiService.analyzePriority(events);
    success(res, result);
});

const suggestSchedule = catchAsync(async (req, res) => {
    const userId = req.user.userId || req.user.id || req.user.user_id;
    const { duration = 1 } = req.query;
    const events = await Event.findByUserId(userId);
    
    const suggestions = await aiService.suggestScheduleTime(events, parseInt(duration));
    success(res, suggestions);
});

const chatAI = catchAsync(async (req, res) => {
    console.log('🎯 chatAI controller called');
    console.log('req.body:', req.body);
    console.log('req.user:', req.user);
    
    const userId = req.user.userId || req.user.id || req.user.user_id;
    const { message, useWebSearch = true } = req.body;

    console.log('👤 User ID:', userId);
    console.log('💬 Message:', message);
    console.log('🌐 Web Search Enabled:', useWebSearch);

    if (!message || message.trim().length === 0) {
        console.log('❌ Message is empty');
        return error(res, 'Vui lòng nhập câu hỏi', 400);
    }

    try {
        const events = await Event.findByUserId(userId);
        console.log('📅 Events loaded:', events ? events.length : 0);
        
        // Use web search if enabled and environment variable allows
        const reply = useWebSearch && process.env.WEB_SEARCH_ENABLED === 'true'
            ? await aiService.chatWithWebSearch(message, events)
            : await aiService.chatWithAI(message, events);
        
        console.log('✅ AI reply:', reply);
        
        success(res, { reply, webSearchUsed: useWebSearch && process.env.WEB_SEARCH_ENABLED === 'true' });
    } catch (err) {
        console.error('💥 chatAI error:', err.message);
        throw err;
    }
});

module.exports = {
    analyzePriority,
    suggestSchedule,
    chatAI
};