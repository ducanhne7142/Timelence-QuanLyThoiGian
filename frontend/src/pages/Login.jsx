import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export default function Login() {
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { login } = useAuth()
    const toast = useToast()

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data) => {
        setIsLoading(true)
        try {
            const response = await login(data.email, data.password)
            if (response.success) {
                toast.success('Đăng nhập thành công!')
                const redirectPath = response.data.user.role === 'admin' ? '/admin' : '/dashboard'
                navigate(redirectPath)
            } else {
                toast.error(response.message || 'Đăng nhập thất bại')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center relative overflow-hidden">
            {/* Background Effects - giống hệt dashboard */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-800/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo chính xác như trong dashboard */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/10 shadow-2xl">
                        {/* Icon lịch giống hệt */}
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl shadow-lg">
                            <CalendarDays className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                Time-lence
                            </h1>
                            <p className="text-white/60 text-sm -mt-1">Quản lý thời gian thông minh</p>
                        </div>
                    </div>
                </div>

                <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">
                                Chào mừng trở lại
                            </h2>
                            <p className="text-white/70">Đăng nhập để tiếp tục quản lý lịch trình</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">Email</label>
                                <Input
                                    type="email"
                                    placeholder="nhập email của bạn"
                                    icon={Mail}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                                    error={errors.email?.message}
                                    {...register('email')}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">Mật khẩu</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    icon={Lock}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-white/70">
                                    <input type="checkbox" className="rounded border-white/30 text-purple-400 focus:ring-purple-400" />
                                    <span>Ghi nhớ đăng nhập</span>
                                </label>
                                <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 transition">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
                            >
                                Đăng nhập
                            </Button>
                        </form>

                        <p className="text-center mt-8 text-white/60">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="text-cyan-400 font-medium hover:text-cyan-300">
                                Đăng ký ngay
                            </Link>
                        </p>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center mt-10 text-white/40 text-sm">
                    © 2025 Time-lence. Tất cả quyền được bảo lưu.
                </p>
            </div>
        </div>
    )
}