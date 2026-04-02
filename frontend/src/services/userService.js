import api from './api'

export const userService = {
    getProfile: async () => {
        const response = await api.get('/users/profile')
        return response.data.data
    },

    updateProfile: async (data) => {
        const response = await api.put('/users/profile', data)
        return response.data
    },

    uploadAvatar: async (file) => {
        const formData = new FormData()
        formData.append('avatar', file)

        const response = await api.post('/users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    },

    changePassword: async (data) => {
        const response = await api.put('/users/change-password', data)
        return response.data
    },

    getActivityLogs: async (params = {}) => {
        const response = await api.get('/users/activity-logs', { params })
        return response.data.data
    },

    getNotificationSettings: async () => {
        const response = await api.get('/users/notification-settings')
        return response.data
    },

    updateNotificationSettings: async (data) => {
        const response = await api.put('/users/notification-settings', data)
        return response.data
    }
}
