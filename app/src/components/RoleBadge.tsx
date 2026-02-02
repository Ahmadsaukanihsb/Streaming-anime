import { getRoleConfig } from '@/config/roles';

interface RoleBadgeProps {
    role: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export default function RoleBadge({ role, size = 'sm', showIcon = true }: RoleBadgeProps) {
    const config = getRoleConfig(role);

    // Don't show badge for regular members (optional)
    if (role === 'member') {
        return null;
    }

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-3 py-1.5'
    };

    return (
        <span
            className={`inline-flex items-center gap-1 font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
            title={config.name}
        >
            {showIcon && <span className="text-[0.9em]">{config.icon}</span>}
            <span>{config.name}</span>
        </span>
    );
}
