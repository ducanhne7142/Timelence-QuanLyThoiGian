import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            setIsLoading(false)
            return
        }

        try {
            const response = await authService.getProfile()
            if (response.success) {
                setUser(response.data)
            }
        } catch (error) {
            localStorage.removeItem('accessToken')
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email, password) => {
        const response = await authService.login({ email, password })
        if (response.success) {
            setUser(response.data.user)
        }
        return response
    }

    const register = async (data) => {
        const response = await authService.register(data)
        return response
    }

    const logout = async () => {
        try {
            await authService.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setUser(null)
            localStorage.removeItem('accessToken')
        }
    }

    const value = {
        user,
        setUser,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkAuth,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
