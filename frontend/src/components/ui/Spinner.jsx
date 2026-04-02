import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

function Spinner({ className, size = 'md' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
    }

    return (
        <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
    )
}

function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size="xl" />
        </div>
    )
}

export { Spinner, PageLoader }
