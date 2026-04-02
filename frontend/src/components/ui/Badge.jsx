import { cn } from '@/utils/cn'

const badgeVariants = {
    default: 'bg-primary text-white',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    outline: 'border border-secondary-200 text-secondary-700'
}

export function Badge({
    className,
    variant = 'default',
    children,
    ...props
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                badgeVariants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}
