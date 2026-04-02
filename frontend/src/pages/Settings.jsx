import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Mail, Monitor, Clock, Save, RotateCcw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { userService } from '@/services/userService'
import { useNotifications } from '@/hooks/useNotifications'

export default function Settings() {
    const [settings, setSettings] = useState({
        email_enabled: true,
        popup_enabled: true,
        default_reminder_minutes: 15
    })
    const toast = useToast()
    const queryClient = useQueryClient()
    const { permission, requestPermission, startPolling, stopPolling } = useNotifications()

    // Fetch notification settings
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['notification-settings'],
        queryFn: userService.getNotificationSettings,
        onSuccess: (data) => {
            if (data.success) {
                setSettings(data.data)
            }
        }
    })

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: userService.updateNotificationSettings,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(['notification-settings'])
                toast.success('Cập nhật cài đặt thành công')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        }
    })

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        updateSettingsMutation.mutate(settings)
    }

    const handleReset = () => {
        const defaultSettings = {
            email_enabled: true,
            popup_enabled: true,
            default_reminder_minutes: 15
        }
        setSettings(defaultSettings)
        updateSettingsMutation.mutate(defaultSettings)
    }

    const handlePopupToggle = async (enabled) => {
        if (enabled) {
            const granted = await requestPermission()
            if (granted) {
                handleSettingChange('popup_enabled', true)
                startPolling()
            } else {
                handleSettingChange('popup_enabled', false)
            }
        } else {
            handleSettingChange('popup_enabled', false)
            stopPolling()
        }
    }

    if (isLoading) {
        return <div className="flex justify-center py-20">Đang tải...</div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 -mt-4" style={{ paddingTop: '3.5rem' }}>
            <div>
                <h1 className="text-2xl font-bold text-secondary-800">Cài đặt</h1>
                <p className="text-secondary-500 mt-1">Tùy chỉnh thông báo và cài đặt ứng dụng</p>
            </div>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Cài đặt thông báo
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-secondary-500" />
                                <h4 className="font-medium text-secondary-800">Thông báo qua Email</h4>
                            </div>
                            <p className="text-sm text-secondary-500">
                                Nhận email nhắc lịch trước sự kiện
                            </p>
                        </div>
                        <Switch
                            checked={settings.email_enabled}
                            onCheckedChange={(checked) => handleSettingChange('email_enabled', checked)}
                        />
                    </div>

                    {/* Browser Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-secondary-500" />
                                <h4 className="font-medium text-secondary-800">Thông báo Popup trong web</h4>
                            </div>
                            <p className="text-sm text-secondary-500">
                                Hiện thông báo ngay trên trình duyệt
                            </p>
                        </div>
                        <Switch
                            checked={settings.popup_enabled}
                            onCheckedChange={handlePopupToggle}
                        />
                    </div>

                    {/* Default Reminder Time */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-secondary-500" />
                            <h4 className="font-medium text-secondary-800">Thời gian nhắc mặc định</h4>
                        </div>
                        <p className="text-sm text-secondary-500">
                            Áp dụng cho các sự kiện mới
                        </p>
                        <Select
                            value={settings.default_reminder_minutes?.toString()}
                            onValueChange={(value) => handleSettingChange('default_reminder_minutes', parseInt(value))}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 phút trước</SelectItem>
                                <SelectItem value="15">15 phút trước</SelectItem>
                                <SelectItem value="30">30 phút trước</SelectItem>
                                <SelectItem value="60">1 giờ trước</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            isLoading={updateSettingsMutation.isPending}
                            className="flex-1 sm:flex-none"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Lưu thay đổi
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            disabled={updateSettingsMutation.isPending}
                            className="flex-1 sm:flex-none"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Khôi phục mặc định
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Browser Compatibility Notice */}
            {typeof window !== 'undefined' && !('Notification' in window) && (
                <Card className="border-warning bg-warning/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bell className="h-3 w-3 text-warning" />
                            </div>
                            <div>
                                <h4 className="font-medium text-warning-800">Thông báo không được hỗ trợ</h4>
                                <p className="text-sm text-warning-700 mt-1">
                                    Trình duyệt của bạn không hỗ trợ thông báo push.
                                    Vui lòng sử dụng trình duyệt hiện đại hơn để nhận thông báo.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
