const express = require('express');
const { catchAsync } = require('../middlewares/errorMiddleware');
const { success, error } = require('../utils/responseHelper');
const googleCalendarService = require('../services/googleCalendarService');
const webSearchService = require('../services/webSearchService');
const aiService = require('../services/aiService');
const Event = require('../models/Event');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Google Calendar OAuth callback
router.get('/google/auth-url', (req, res) => {
    const authUrl = googleCalendarService.getAuthUrl();
    success(res, { authUrl });
});

// Google Calendar OAuth callback handler
router.post('/google/callback', catchAsync(async (req, res) => {
    const { code } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!code) {
        return error(res, 'Authorization code is required', 400);
    }

    try {
        const tokens = await googleCalendarService.getAccessToken(code);
        
        // Here you would save tokens to database associated with userId
        // For now, we'll just return success
        success(res, { 
            message: 'Google Calendar connected successfully',
            tokens: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date
            }
        });
    } catch (err) {
        console.error('Google OAuth error:', err);
        error(res, 'Failed to authenticate with Google Calendar', 500);
    }
}));

// Sync Google Calendar events
router.post('/google/sync', authenticate, catchAsync(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const { accessToken } = req.body;

    if (!accessToken) {
        return error(res, 'Access token is required', 400);
    }

    try {
        const googleEvents = await googleCalendarService.syncGoogleCalendar(userId, accessToken);
        success(res, { 
            message: `Synced ${googleEvents.length} events from Google Calendar`,
            events: googleEvents 
        });
    } catch (err) {
        console.error('Sync error:', err);
        error(res, 'Failed to sync Google Calendar', 500);
    }
}));

// Web search endpoint
router.post('/search', authenticate, catchAsync(async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return error(res, 'Search query is required', 400);
    }

    try {
        console.log('🔍 Web search request:', query);
        const results = await webSearchService.searchWeb(query, 5);
        
        success(res, {
            query: query,
            results: results,
            count: results.length
        });
    } catch (err) {
        console.error('Search error:', err);
        error(res, 'Failed to search', 500);
    }
}));

// Enhanced AI chat with web search
router.post('/chat-enhanced', authenticate, catchAsync(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
        return error(res, 'Message is required', 400);
    }

    try {
        console.log('💬 Enhanced chat request:', message);
        
        // Get user events
        const events = await Event.findByUserId(userId);
        
        // Use AI with web search
        const reply = await aiService.chatWithWebSearch(message, events);
        
        success(res, { 
            message: message,
            reply: reply,
            hasWebSearch: aiService.shouldSearchWeb(message)
        });
    } catch (err) {
        console.error('Chat error:', err);
        error(res, 'Failed to process chat', 500);
    }
}));

module.exports = router;
