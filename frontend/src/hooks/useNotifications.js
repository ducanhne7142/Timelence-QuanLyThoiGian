import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

// Notification service
const notificationService = {
    getPending: async (type = 'popup') => {
        const response = await api.get('/notifications/pending', { params: { type } })
        return response.data
    },

    markAsSent: async (id) => {
        const response = await api.post(`/notifications/${id}/mark-sent`)
        return response.data
    }
}

export function useNotifications() {
    const [permission, setPermission] = useState(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
        return Notification.permission
    })
    const [isPolling, setIsPolling] = useState(false)

    const { isAuthenticated } = useAuth()
    const toast = useToast()
    const queryClient = useQueryClient()

    // Request permission
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            toast.error('Trình duyệt không hỗ trợ thông báo')
            return false
        }

        if (permission === 'granted') return true

        try {
            const result = await Notification.requestPermission()
            setPermission(result)

            if (result === 'granted') {
                toast.success('Đã bật thông báo trình duyệt')
                return true
            } else if (result === 'denied') {
                toast.error('Bạn đã từ chối thông báo. Vui lòng bật lại trong cài đặt trình duyệt')
                return false
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            toast.error('Không thể yêu cầu quyền thông báo')
            return false
        }

        return false
    }, [permission, toast])

    // Show notification
    const showNotification = useCallback((reminder) => {
        if (permission !== 'granted') return

        try {
            const notification = new Notification('Nhắc lịch', {
                body: `Sự kiện "${reminder.title}" sẽ bắt đầu sau ${reminder.minutes_before} phút`,
                icon: '/favicon.ico',
                tag: `event-${reminder.event_id}`,
                requireInteraction: true,
                data: {
                    eventId: reminder.event_id,
                    reminderId: reminder.reminder_id
                }
            })

            notification.onclick = () => {
                window.focus()
                // Navigate to calendar with event
                const url = `/calendar?event=${reminder.event_id}&date=${reminder.start_time.split('T')[0]}`
                window.location.href = url
                notification.close()
            }

            // Auto close after 10 seconds
            setTimeout(() => {
                notification.close()
            }, 10000)

            return notification
        } catch (error) {
            console.error('Error showing notification:', error)
            // Fallback to toast
            toast.info(`Nhắc lịch: "${reminder.title}" sẽ bắt đầu sau ${reminder.minutes_before} phút`)
        }
    }, [permission, toast])

    // Mark as sent mutation
    const markAsSentMutation = useMutation({
        mutationFn: notificationService.markAsSent,
        onSuccess: () => {
            queryClient.invalidateQueries(['pending-notifications'])
        },
        onError: (error) => {
            console.error('Error marking notification as sent:', error)
        }
    })

    // Polling for pending notifications
    const { data: pendingNotifications = [] } = useQuery({
        queryKey: ['pending-notifications'],
        queryFn: () => notificationService.getPending('popup'),
        enabled: isAuthenticated && isPolling && permission === 'granted',
        refetchInterval: 30000, // Poll every 30 seconds
        select: (data) => data.success ? data.data : []
    })

    // Process pending notifications
    useEffect(() => {
        if (!pendingNotifications.length || permission !== 'granted') return

        pendingNotifications.forEach(reminder => {
            showNotification(reminder)
            markAsSentMutation.mutate(reminder.reminder_id)
        })
    }, [pendingNotifications, permission, showNotification, markAsSentMutation])

    // Start/stop polling
    const startPolling = useCallback(() => {
        if (permission === 'granted') {
            setIsPolling(true)
        }
    }, [permission])

    const stopPolling = useCallback(() => {
        setIsPolling(false)
    }, [])

    // Auto start polling when permission is granted
    useEffect(() => {
        if (permission === 'granted' && isAuthenticated) {
            startPolling()
        } else {
            stopPolling()
        }
    }, [permission, isAuthenticated, startPolling, stopPolling])

    return {
        permission,
        requestPermission,
        showNotification,
        isPolling,
        startPolling,
        stopPolling,
        pendingCount: pendingNotifications.length
    }
}

// Hook for notification settings integration
export function useNotificationSettings() {
    const { permission, requestPermission } = useNotifications()

    const handleToggleNotifications = async (enabled) => {
        if (enabled) {
            const granted = await requestPermission()
            return granted
        } else {
            // Can't programmatically revoke permission
            // User needs to do it in browser settings
            return true
        }
    }

    return {
        permission,
        isSupported: 'Notification' in window,
        handleToggleNotifications
    }
}
