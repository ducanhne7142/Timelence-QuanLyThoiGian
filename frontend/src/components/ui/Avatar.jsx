import { cn } from '@/utils/cn'
import { User } from 'lucide-react'

function Avatar({ className, src, alt, size = 'md', ...props }) {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-20 w-20',
        '2xl': 'h-32 w-32'
    }

    return (
        <div
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full',
                sizes[size],
                className
            )}
            {...props}
        >
            {src ? (
                <img
                    className="aspect-square h-full w-full object-cover"
                    src={src}
                    alt={alt}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary-100">
                    <User className="h-1/2 w-1/2 text-secondary-400" />
                </div>
            )}
        </div>
    )
}

function AvatarImage({ className, src, alt, ...props }) {
    return (
        <img
            className={cn('aspect-square h-full w-full object-cover', className)}
            src={src}
            alt={alt}
            {...props}
        />
    )
}

function AvatarFallback({ className, children, ...props }) {
    return (
        <div
            className={cn(
                'flex h-full w-full items-center justify-center rounded-full bg-secondary-100 text-secondary-600',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export { Avatar, AvatarImage, AvatarFallback }
