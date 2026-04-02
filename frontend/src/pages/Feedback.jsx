import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MessageCircle, Send, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

// Category options
const FEEDBACK_CATEGORIES = [
    { value: 'bug', label: 'Báo lỗi', description: 'Báo cáo lỗi trong hệ thống' },
    { value: 'feature', label: 'Đề xuất tính năng', description: 'Đề xuất tính năng mới' },
    { value: 'improvement', label: 'Cải thiện', description: 'Góp ý cải thiện sản phẩm' },
    { value: 'question', label: 'Câu hỏi', description: 'Đặt câu hỏi về sử dụng' },
    { value: 'other', label: 'Khác', description: 'Các góp ý khác' }
]

// Feedback API service
const feedbackAPI = {
    create: async (data) => {
        const response = await api.post('/feedbacks', data)
        return response.data
    }
}

export default function Feedback() {
    const [formData, setFormData] = useState({
        subject: '',
        message: ''
    })
    const [submitted, setSubmitted] = useState(false)

    const toast = useToast()

    const submitMutation = useMutation({
        mutationFn: feedbackAPI.create,
        onSuccess: () => {
            toast.success('Đã gửi phản hồi thành công. Cảm ơn bạn!')
            setSubmitted(true)
            setFormData({ subject: '', message: '' })
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!formData.subject || !formData.message) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        submitMutation.mutate(formData)
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg border p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Cảm ơn bạn đã gửi phản hồi!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Chúng tôi đã nhận được phản hồi của bạn và sẽ xem xét trong thời gian sớm nhất.
                        Bạn sẽ nhận được thông báo qua email khi có phản hồi từ đội ngũ hỗ trợ.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button
                            onClick={() => setSubmitted(false)}
                            variant="outline"
                        >
                            Gửi phản hồi khác
                        </Button>
                        <Button onClick={() => window.location.href = '/dashboard'}>
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto -mt-4" style={{ paddingTop: '3.5rem' }}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Gửi phản hồi</h1>
                <p className="text-lg text-gray-600">
                    Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện sản phẩm tốt hơn.
                    Vui lòng chia sẻ góp ý, báo lỗi hoặc đề xuất tính năng mới.
                </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tiêu đề *
                        </label>
                        <Input
                            value={formData.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            placeholder="Nhập tiêu đề ngắn gọn về vấn đề..."
                            required
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung chi tiết *
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            className="w-full min-h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả chi tiết vấn đề, góp ý hoặc đề xuất của bạn..."
                            required
                        />
                        <div className="mt-2 text-sm text-gray-500">
                            Càng chi tiết càng giúp chúng tôi hiểu rõ và hỗ trợ bạn tốt hơn.
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            isLoading={submitMutation.isLoading}
                            className="flex items-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Gửi phản hồi
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormData({ subject: '', message: '' })}
                        >
                            Xóa form
                        </Button>
                    </div>
                </form>
            </div>

            {/* Help Info */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-blue-900 mb-2">
                            Một số gợi ý khi gửi phản hồi:
                        </h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Báo lỗi:</strong> Mô tả cách tái hiện lỗi, trình duyệt đang dùng</li>
                            <li>• <strong>Đề xuất tính năng:</strong> Giải thích tại sao tính năng này hữu ích</li>
                            <li>• <strong>Cải thiện:</strong> Chỉ ra cụ thể phần nào cần cải thiện</li>
                            <li>• <strong>Câu hỏi:</strong> Mô tả rõ vấn đề bạn đang gặp phải</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
