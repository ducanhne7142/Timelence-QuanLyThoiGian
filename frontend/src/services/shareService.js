import api from './api'

export const shareService = {
    // Create share link
    create: async (data) => {
        const response = await api.post('/shares', data)
        return response.data
    },

    // Get user's shared schedules
    getUserShares: async () => {
        const response = await api.get('/shares')
        return response.data
    },

    // Toggle share status
    toggleShare: async (id, is_active) => {
        const response = await api.patch(`/shares/${id}/toggle`, { is_active })
        return response.data
    },

    // Delete share
    deleteShare: async (id) => {
        const response = await api.delete(`/shares/${id}`)
        return response.data
    },

    // Get shared schedule (public)
    getSharedSchedule: async (token, password = null) => {
        const response = await api.post(`/shares/shared/${token}`, password ? { password } : {})
        return response.data
    }
}

export default shareService
