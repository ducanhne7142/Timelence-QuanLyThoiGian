// src/pages/auth/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Cần ít nhất 1 số'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

// Component thanh độ mạnh mật khẩu – ĐÃ SỬA LỖI className trùng
function PasswordStrength({ password = '' }) {
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { level: 1, text: 'Yếu', color: 'bg-red-500' }
    if (score <= 3) return { level: 2, text: 'Trung bình', color: 'bg-yellow-500' }
    return { level: 3, text: 'Mạnh', color: 'bg-green-500' }
  }

  const { level, text, color } = getStrength()
  if (!password) return null

  return (
    <div className="mt-3">
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i <= level ? color : 'bg-white/20'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        level === 1 ? 'text-red-400' : level === 2 ? 'text-yellow-400' : 'text-green-400'
      }`}>
        Độ mạnh: {text}
      </p>
    </div>
  )
}

export default function Register() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await registerUser({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      })

      if (response.success) {
        toast.success('Đăng ký thành công! Đang chuyển về đăng nhập...')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        toast.error(response.message || 'Đăng ký thất bại')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo giống hệt Login */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/10 shadow-2xl">
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

        {/* Register Form */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Tạo tài khoản mới</h2>
              <p className="text-white/70">Bắt đầu quản lý thời gian hiệu quả ngay hôm nay</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Họ và tên</label>
                <Input
                  type="text"
                  placeholder="Nguyễn Văn Á"
                  icon={User}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
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
                  placeholder="Ít nhất 8 ký tự, có hoa, thường, số"
                  icon={Lock}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <PasswordStrength password={password} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Xác nhận mật khẩu</label>
                <Input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  icon={Lock}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 rounded border-white/30 text-purple-400 focus:ring-purple-400"
                />
                <span>
                  Tôi đồng ý với{' '}
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Điều khoản dịch vụ</a> và{' '}
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Chính sách bảo mật</a>
                </span>
              </label>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
              >
                Đăng ký ngay
              </Button>
            </form>

            <p className="text-center mt-8 text-white/60">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-cyan-400 font-medium hover:text-cyan-300 transition">
                Đăng nhập
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center mt-10 text-white/40 text-sm">
          © 2025 Time-lence. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  )
}