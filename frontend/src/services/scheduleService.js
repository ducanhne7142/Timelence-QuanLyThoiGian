import api from './api'

export const scheduleService = {
    getAll: async () => {
        const response = await api.get('/schedules')
        return response.data
    },

    getById: async (id) => {
        const response = await api.get(`/schedules/${id}`)
        return response.data
    },

    create: async (data) => {
        const response = await api.post('/schedules', data)
        return response.data
    },

    update: async (id, data) => {
        const response = await api.put(`/schedules/${id}`, data)
        return response.data
    },

    delete: async (id) => {
        const response = await api.delete(`/schedules/${id}`)
        return response.data
    },

    // Share functionality
    getShared: async (token, password = null) => {
        const response = await api.post(`/shares/shared/${token}`, password ? { password } : {})
        return response.data
    }
}
