// src/pages/auth/ForgotPassword.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, CalendarDays, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { authService } from '@/services/authService'
import { useToast } from '@/components/ui/Toast'

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP phải có đúng 6 số'),
})

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Mật khẩu ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Cần ít nhất 1 số'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1: email, 2: otp, 3: password, 4: success
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()
  const toast = useToast()

  const emailForm = useForm({ resolver: zodResolver(emailSchema) })
  const otpForm = useForm({ resolver: zodResolver(otpSchema) })
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async (data) => {
    setIsLoading(true)
    try {
      const res = await authService.forgotPassword(data.email)
      if (res.success) {
        setEmail(data.email)
        setStep(2)
        startCountdown()
        toast.success('Mã OTP đã được gửi đến email của bạn')
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (data) => {
    setIsLoading(true)
    try {
      const res = await authService.verifyOTP(email, data.otp)
      if (res.success) {
        setOtp(data.otp)
        setStep(3)
        toast.success('OTP hợp lệ!')
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP không hợp lệ')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (data) => {
    setIsLoading(true)
    try {
      const res = await authService.resetPassword(email, otp, data.newPassword)
      if (res.success) {
        setStep(4)
        toast.success('Đặt lại mật khẩu thành công!')
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    await handleSendOTP({ email })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Blobs – giống hệt Login/Register */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo chuẩn Time-lence */}
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

        {/* Stepper thanh tiến trình */}
        <div className="flex justify-center items-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 rounded-full ${step > s ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card chính */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardContent className="p-10">

            {/* Bước 1: Nhập email */}
            {step === 1 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Quên mật khẩu?</h2>
                  <p className="text-white/70">Chúng tôi sẽ gửi mã xác nhận đến email của bạn</p>
                </div>
                <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      icon={Mail}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                      error={emailForm.formState.errors.email?.message}
                      {...emailForm.register('email')}
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
                  >
                    Gửi mã xác nhận
                  </Button>
                </form>
              </>
            )}

            {/* Bước 2: Nhập OTP */}
            {step === 2 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Nhập mã OTP</h2>
                  <p className="text-white/70">Mã đã được gửi đến <span className="text-cyan-400 font-medium">{email}</span></p>
                </div>
                <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Mã OTP (6 số)</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400"
                      error={otpForm.formState.errors.otp?.message}
                      {...otpForm.register('otp')}
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
                  >
                    Xác nhận OTP
                  </Button>

                  <p className="text-center text-sm text-white/60">
                    Chưa nhận được mã?{' '}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                      className={`font-medium transition ${
                        countdown > 0
                          ? 'text-white/40 cursor-not-allowed'
                          : 'text-cyan-400 hover:text-cyan-300'
                      }`}
                    >
                      Gửi lại {countdown > 0 && `(${countdown}s)`}
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* Bước 3: Đặt mật khẩu mới */}
            {step === 3 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Đặt lại mật khẩu</h2>
                  <p className="text-white/70">Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>
                <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Mật khẩu mới</label>
                    <Input
                      type="password"
                      placeholder="Ít nhất 8 ký tự"
                      icon={Lock}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                      error={passwordForm.formState.errors.newPassword?.message}
                      {...passwordForm.register('newPassword')}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">Xác nhận mật khẩu</label>
                    <Input
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      icon={Lock}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400"
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      {...passwordForm.register('confirmPassword')}
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
                  >
                    Cập nhật mật khẩu
                  </Button>
                </form>
              </>
            )}

            {/* Bước 4: Thành công */}
            {step === 4 && (
              <div className="text-center py-12">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-3">Thành công!</h2>
                <p className="text-white/70 mb-8">Mật khẩu của bạn đã được cập nhật</p>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  Đăng nhập ngay
                </Button>
              </div>
            )}

            {/* Nút quay lại đăng nhập (trừ bước thành công) */}
            {step < 4 && (
              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-cyan-300 transition text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            )}
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