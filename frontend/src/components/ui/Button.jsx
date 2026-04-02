import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    {
        variants: {
            variant: {
                primary: 'bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary-600 hover:to-purple-700 focus:ring-primary shadow-lg hover:shadow-xl transition-all duration-200',
                secondary: 'bg-white/80 backdrop-blur-sm text-secondary-700 hover:bg-white/90 focus:ring-secondary border border-white/20 shadow-md',
                outline: 'border-2 border-primary/30 bg-transparent hover:bg-primary/10 focus:ring-primary text-primary',
                ghost: 'bg-transparent hover:bg-white/50 focus:ring-secondary',
                destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-error shadow-lg',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-10 px-4',
                lg: 'h-12 px-6 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
)

const Button = forwardRef(({
    className,
    variant,
    size,
    isLoading,
    children,
    ...props
}, ref) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
