import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Request interceptor - add access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const { data } = await axios.post('/api/auth/refresh-token', {}, {
                    withCredentials: true
                })

                if (data.success) {
                    localStorage.setItem('accessToken', data.data.accessToken)
                    originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
                    return api(originalRequest)
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export const aiApi = {
    analyzePriority: () => api.get('/ai/priority').then(r => r.data.data),
    findFreeTime: (duration = 60) => api.get(`/ai/suggest-schedule?duration=${duration}`).then(r => r.data.data),
    chat: (message) => api.post('/ai/chat', { message }).then(r => {
        console.log('📨 Full API Response:', r.data);
        console.log('📨 Data Object:', r.data.data);
        const responseData = r.data.data;
        console.log('📨 Reply:', responseData?.reply);
        return {
            answer: responseData?.reply || 'Không có phản hồi từ AI',
            data: null
        };
    }).catch(err => {
        console.error('❌ Chat API Error:', err);
        throw err;
    })
}

export default api
