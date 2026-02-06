interface StatusBadgeProps {
  status: 'Ongoing' | 'Completed' | string;
  variant?: 'solid' | 'subtle';
  className?: string;
}

export default function StatusBadge({ 
  status, 
  variant = 'subtle',
  className = '' 
}: StatusBadgeProps) {
  const isOngoing = status === 'Ongoing';
  
  const styles = {
    solid: isOngoing 
      ? 'bg-green-500/80 text-white' 
      : 'bg-blue-500/80 text-white',
    subtle: isOngoing 
      ? 'bg-green-500/20 text-green-400' 
      : 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${styles[variant]} ${className}`}>
      {status}
    </span>
  );
}

// Preset configurations for common use cases
export const StatusBadgePresets = {
  // For cards with image backgrounds
  card: { variant: 'solid' as const },
  // For list items
  list: { variant: 'subtle' as const },
};
