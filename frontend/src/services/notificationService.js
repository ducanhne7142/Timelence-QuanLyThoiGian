import api from './api'

export const notificationService = {
    // Get pending reminders for current user  
    getPendingReminders: () => api.get('/reminders/pending'),

    // Get recent notifications (sent in last 24 hours)
    getRecentNotifications: () => api.get('/reminders/recent'),

    // Mark reminder as read (if needed later)
    markAsRead: (reminderId) => api.patch(`/reminders/${reminderId}/read`)
}

export default notificationService
