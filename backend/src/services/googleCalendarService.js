const { google } = require('googleapis');
const axios = require('axios');

class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    // Get authorization URL
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    // Get access token from code
    async getAccessToken(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            console.log('✅ Google OAuth tokens obtained');
            return tokens;
        } catch (error) {
            console.error('❌ Error getting Google OAuth tokens:', error.message);
            throw error;
        }
    }

    // Get Google Calendar events
    async getCalendarEvents(accessToken, timeMin, timeMax) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });
            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date(timeMin).toISOString(),
                timeMax: new Date(timeMax).toISOString(),
                maxResults: 50,
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items || [];
        } catch (error) {
            console.error('❌ Error fetching Google Calendar events:', error.message);
            return [];
        }
    }

    // Format Google Calendar event to match our schema
    formatGoogleEvent(googleEvent) {
        return {
            id: `google_${googleEvent.id}`,
            title: googleEvent.summary || 'No title',
            description: googleEvent.description || '',
            start_time: googleEvent.start.dateTime || googleEvent.start.date,
            end_time: googleEvent.end.dateTime || googleEvent.end.date,
            location: googleEvent.location || '',
            calendar_source: 'google',
            attendees: googleEvent.attendees ? googleEvent.attendees.length : 0,
            isAllDay: !googleEvent.start.dateTime
        };
    }

    // Sync Google Calendar with local database
    async syncGoogleCalendar(userId, accessToken) {
        try {
            console.log('🔄 Syncing Google Calendar for user:', userId);
            
            const now = new Date();
            const threeMothsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            const googleEvents = await this.getCalendarEvents(accessToken, now, threeMothsLater);
            const formattedEvents = googleEvents.map(event => this.formatGoogleEvent(event));

            console.log(`✅ Synced ${formattedEvents.length} events from Google Calendar`);
            return formattedEvents;
        } catch (error) {
            console.error('❌ Error syncing Google Calendar:', error.message);
            return [];
        }
    }
}

module.exports = new GoogleCalendarService();
