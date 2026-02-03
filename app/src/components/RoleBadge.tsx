import type { ComponentType } from 'react';
import {
    Award,
    User,
    Heart,
    Shield,
    Crown,
    Star,
    ShieldCheck,
    Zap,
    Flame,
    Gem,
    Trophy,
    Medal,
    Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
    User,
    Heart,
    Shield,
    Crown,
    Star,
    ShieldCheck,
    Award,
    Zap,
    Flame,
    Gem,
    Trophy,
    Medal,
    Sparkles,
};

interface RoleBadgeProps {
    role: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export default function RoleBadge({ role, size = 'sm', showIcon = true }: RoleBadgeProps) {
    const { getBadgeConfig } = useApp();
    const normalizedRole = role.toLowerCase();
    const config = getBadgeConfig(normalizedRole);

    // Don't show badge for regular members (optional)
    if (normalizedRole === 'member') {
        return null;
    }

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-3 py-1.5'
    };
    const iconSizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4'
    };
    const emojiSizeClasses = {
        sm: 'text-[0.8em]',
        md: 'text-[0.9em]',
        lg: 'text-[1em]'
    };

    return (
        <span
            className={`inline-flex items-center gap-1 font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
            title={config.name}
        >
            {showIcon && (
                (() => {
                    const Icon = iconMap[config.icon];
                    if (Icon) {
                        return <Icon className={iconSizeClasses[size]} />;
                    }
                    if (config.icon && config.icon.trim().length > 0 && config.icon.trim().length <= 2) {
                        return <span className={emojiSizeClasses[size]}>{config.icon}</span>;
                    }
                    return <Award className={iconSizeClasses[size]} />;
                })()
            )}
            <span>{config.name}</span>
        </span>
    );
}
