import { forwardRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(({
    className,
    type = 'text',
    label,
    error,
    icon: Icon,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-sm font-medium text-secondary-700">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
                <input
                    type={isPassword && showPassword ? 'text' : type}
                    className={cn(
                        'w-full px-3 py-2.5 border border-white/30 rounded-lg text-sm bg-white/80 backdrop-blur-sm',
                        'placeholder:text-secondary-400',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-white',
                        'disabled:bg-secondary-50 disabled:cursor-not-allowed transition-all duration-200',
                        Icon && 'pl-10',
                        isPassword && 'pr-10',
                        error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-sm text-error">{error}</p>
            )}
        </div>
    )
})

Input.displayName = 'Input'

export { Input }
