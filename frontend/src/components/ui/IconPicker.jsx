import { useState } from 'react'
import { Search, X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Input } from './Input'
import { Button } from './Button'
import { cn } from '@/utils/cn'

// Popular Lucide icons for categories with their actual components
const LUCIDE_ICON_NAMES = [
    // Study & Education
    'BookOpen', 'GraduationCap', 'School', 'FileText', 'PenTool', 'BookMarked',
    // Work & Business
    'Briefcase', 'Building2', 'Laptop', 'FileCheck', 'Target', 'TrendingUp',
    // Health & Fitness
    'Dumbbell', 'Heart', 'Activity', 'Bike', 'Running', 'Swimming',
    // Food & Meal
    'Utensils', 'Coffee', 'Apple', 'ChefHat', 'Wine', 'Cookie',
    // Sleep & Rest
    'Moon', 'Bed', 'Sunset', 'Cloud', 'Wind',
    // Entertainment
    'Gamepad2', 'Music', 'Film', 'Tv', 'Headphones', 'Palette',
    // Social & Meeting
    'Users', 'MessageCircle', 'Phone', 'Video', 'Calendar', 'Clock',
    // Travel & Transport
    'Car', 'Plane', 'Train', 'MapPin', 'Compass', 'Navigation',
    // Shopping & Money
    'ShoppingCart', 'CreditCard', 'Wallet', 'Coins', 'Receipt', 'Tag',
    // Home & Family
    'Home', 'Baby', 'Dog', 'Cat', 'TreePine',
    // Sports
    'Trophy', 'Award', 'Medal', 'Flag', 'Shield', 'Star',
    // Other
    'Gift', 'Sparkles', 'Smile', 'ThumbsUp', 'Zap', 'Lightbulb'
]

// Get icon component by name
const getIconComponent = (iconName) => {
    return LucideIcons[iconName] || LucideIcons.Star
}

// Popular emojis
const EMOJI_ICONS = [
    '📚', '📖', '✏️', '📝', '🎓', '💼', '💻', '📊', '📈', '💪',
    '🏃', '🚴', '🏊', '⚽', '🏀', '🎾', '🍎', '🍕', '🍔', '☕',
    '🍽️', '🍰', '🍷', '😴', '🌙', '🌅', '🎮', '🎵', '🎬', '📺',
    '🎧', '🎨', '👥', '💬', '📞', '📹', '📅', '⏰', '🚗', '✈️',
    '🚂', '📍', '🧭', '🛒', '💳', '💰', '💵', '🏠', '❤️', '👶',
    '🐶', '🐱', '🌲', '🏆', '🥇', '🎖️', '🏁', '🛡️', '⭐', '😊',
    '👍', '🎁', '✨', '🔥', '💡', '🎯', '📌', '🔔', '🎪', '🎭'
]

export default function IconPicker({ value, onChange, className }) {
    const [activeTab, setActiveTab] = useState('emoji') // 'emoji' or 'icon'
    const [searchQuery, setSearchQuery] = useState('')
    const [showPicker, setShowPicker] = useState(false)

    // Filter icons based on search
    const filteredLucideIcons = LUCIDE_ICON_NAMES.filter(icon =>
        icon.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredEmojiIcons = EMOJI_ICONS.filter(emoji =>
        emoji.includes(searchQuery)
    )

    const handleIconSelect = (icon) => {
        onChange(icon)
        setShowPicker(false)
        setSearchQuery('')
    }

    return (
        <div className={cn("relative", className)}>
            {/* Current icon display */}
            <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="w-full px-3 py-2 border border-white/30 rounded-lg text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 flex items-center justify-between"
            >
                <span className="text-2xl">{value || '📋'}</span>
                <span className="text-xs text-secondary-400">Chọn icon</span>
            </button>

            {/* Picker dropdown */}
            {showPicker && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            setShowPicker(false)
                            setSearchQuery('')
                        }}
                    />
                    <div className="absolute top-full left-0 mt-2 w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 z-50 max-h-96 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-white/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Search className="h-4 w-4 text-secondary-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm icon..."
                                    className="flex-1"
                                />
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('emoji')}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        activeTab === 'emoji'
                                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                                            : 'bg-white/50 text-secondary-600 hover:bg-white/80'
                                    )}
                                >
                                    Emoji
                                </button>
                                <button
                                    onClick={() => setActiveTab('icon')}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                        activeTab === 'icon'
                                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                                            : 'bg-white/50 text-secondary-600 hover:bg-white/80'
                                    )}
                                >
                                    Icon
                                </button>
                            </div>
                        </div>

                        {/* Icons grid */}
                        <div className="p-4 overflow-y-auto max-h-64">
                            {activeTab === 'emoji' ? (
                                <div className="grid grid-cols-8 gap-2">
                                    {filteredEmojiIcons.map((emoji, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleIconSelect(emoji)}
                                            className={cn(
                                                "w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-white/50 transition-colors",
                                                value === emoji && "bg-primary/20 ring-2 ring-primary"
                                            )}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-2">
                                    {filteredLucideIcons.map((iconName, index) => {
                                        const IconComponent = getIconComponent(iconName)
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleIconSelect(iconName)}
                                                className={cn(
                                                    "w-12 h-12 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors border border-white/20",
                                                    value === iconName && "bg-primary/20 ring-2 ring-primary"
                                                )}
                                                title={iconName}
                                            >
                                                <IconComponent className="h-5 w-5 text-secondary-600" />
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-white/20 bg-gradient-to-r from-white/80 to-purple-50/50 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowPicker(false)
                                    setSearchQuery('')
                                }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Đóng
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

