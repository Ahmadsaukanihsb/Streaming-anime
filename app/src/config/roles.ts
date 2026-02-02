// Community Role Configuration
// Defines roles with their display properties and permissions

export const COMMUNITY_ROLES = {
    member: {
        name: 'Member',
        color: '#9CA3AF',      // Gray
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        icon: '👤',
        priority: 0,
    },
    supporter: {
        name: 'Supporter',
        color: '#34D399',      // Green
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        icon: '💚',
        priority: 1,
    },
    knight: {
        name: 'Knight',
        color: '#60A5FA',      // Blue
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        icon: '⚔️',
        priority: 2,
    },
    guardian: {
        name: 'Guardian',
        color: '#A78BFA',      // Purple
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-400',
        icon: '🛡️',
        priority: 3,
    },
    legend: {
        name: 'Legend',
        color: '#FBBF24',      // Gold
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-400',
        icon: '⭐',
        priority: 4,
    },
    moderator: {
        name: 'Moderator',
        color: '#F472B6',      // Pink
        bgColor: 'bg-pink-500/20',
        textColor: 'text-pink-400',
        icon: '🔧',
        priority: 5,
    },
    admin: {
        name: 'Admin',
        color: '#F87171',      // Red
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        icon: '👑',
        priority: 6,
    },
};

export type CommunityRoleType = keyof typeof COMMUNITY_ROLES;

export const getRoleConfig = (role: string) => {
    return COMMUNITY_ROLES[role as CommunityRoleType] || COMMUNITY_ROLES.member;
};

// Role Badge Component helper
export const getRoleBadgeClasses = (role: string) => {
    const config = getRoleConfig(role);
    return `${config.bgColor} ${config.textColor}`;
};
