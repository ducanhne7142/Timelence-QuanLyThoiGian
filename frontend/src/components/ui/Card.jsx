import { cn } from '@/utils/cn'

function Card({ className, ...props }) {
    return (
        <div
            className={cn(
                'bg-white/90 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg',
                className
            )}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }) {
    return (
        <div
            className={cn('px-6 py-4 border-b border-white/20', className)}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }) {
    return (
        <h3
            className={cn('text-lg font-semibold text-secondary-800', className)}
            {...props}
        />
    )
}

function CardDescription({ className, ...props }) {
    return (
        <p
            className={cn('text-sm text-secondary-500 mt-1', className)}
            {...props}
        />
    )
}

function CardContent({ className, ...props }) {
    return (
        <div className={cn('px-6 py-4', className)} {...props} />
    )
}

function CardFooter({ className, ...props }) {
    return (
        <div
            className={cn('px-6 py-4 border-t border-white/20 bg-gradient-to-r from-white/50 to-purple-50/50', className)}
            {...props}
        />
    )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
