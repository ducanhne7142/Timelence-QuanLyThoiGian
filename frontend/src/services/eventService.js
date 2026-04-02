import api from './api'

export const eventService = {
    getAll: async (params = {}) => {
        const response = await api.get('/events', { params })
        return response.data
    },

    getById: async (id) => {
        const response = await api.get(`/events/${id}`)
        return response.data
    },

    create: async (data) => {
        const response = await api.post('/events', data)
        return response.data
    },

    update: async (id, data) => {
        const response = await api.put(`/events/${id}`, data)
        return response.data
    },

    delete: async (id) => {
        const response = await api.delete(`/events/${id}`)
        return response.data
    },

    move: async (id, data) => {
        const response = await api.patch(`/events/${id}/move`, data)
        return response.data
    },

    getToday: async () => {
        const response = await api.get('/events/today')
        return response.data
    },

    getUpcoming: async (limit = 10) => {
        const response = await api.get('/events/upcoming', { params: { limit } })
        return response.data
    },

    search: async (keyword, params = {}) => {
        const response = await api.get('/events/search', {
            params: { ...params, q: keyword }
        })
        return response.data
    }
}
