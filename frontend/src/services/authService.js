import api from './api'

export const authService = {
    register: async (data) => {
        const response = await api.post('/auth/register', data)
        return response.data
    },

    login: async (data) => {
        const response = await api.post('/auth/login', data)
        if (response.data.success) {
            localStorage.setItem('accessToken', response.data.data.accessToken)
        }
        return response.data
    },

    logout: async () => {
        const response = await api.post('/auth/logout')
        localStorage.removeItem('accessToken')
        return response.data
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile')
        return response.data
    },

    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email })
        return response.data
    },

    verifyOTP: async (email, otp) => {
        const response = await api.post('/auth/verify-otp', { email, otp })
        return response.data
    },

    resetPassword: async (email, otp, newPassword) => {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword })
        return response.data
    },
}
