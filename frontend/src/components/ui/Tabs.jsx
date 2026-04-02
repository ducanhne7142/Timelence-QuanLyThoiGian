import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/utils/cn'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
    return (
        <TabsPrimitive.List
            className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-secondary-100 p-1 text-secondary-500',
                className
            )}
            {...props}
        />
    )
}

function TabsTrigger({ className, ...props }) {
    return (
        <TabsPrimitive.Trigger
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'data-[state=active]:bg-white data-[state=active]:text-secondary-800 data-[state=active]:shadow-sm',
                className
            )}
            {...props}
        />
    )
}

function TabsContent({ className, ...props }) {
    return (
        <TabsPrimitive.Content
            className={cn(
                'mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                className
            )}
            {...props}
        />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
