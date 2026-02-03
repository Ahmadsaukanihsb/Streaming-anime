import { useState } from 'react';
import { cn } from '@/lib/utils';

type SafeAvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  loading?: boolean;
  className?: string;
  imgClassName?: string;
  fallbackBgClassName?: string;
  fallbackClassName?: string;
  skeletonClassName?: string;
};

export default function SafeAvatar({
  src,
  alt,
  name,
  loading,
  className,
  imgClassName,
  fallbackBgClassName,
  fallbackClassName,
  skeletonClassName
}: SafeAvatarProps) {
  const [error, setError] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const showImage = src && !error;
  const fallbackBg = fallbackBgClassName || 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF]';
  const showSkeleton = Boolean(loading);

  return (
    <div className={cn('rounded-full overflow-hidden flex items-center justify-center', className)}>
      {showSkeleton ? (
        <div
          className={cn(
            'w-full h-full bg-white/10 animate-pulse',
            skeletonClassName
          )}
        />
      ) : showImage ? (
        <img
          src={src}
          alt={alt || name || 'avatar'}
          className={cn('w-full h-full object-cover', imgClassName)}
          onError={() => setError(true)}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full text-white font-bold flex items-center justify-center',
            fallbackBg,
            fallbackClassName
          )}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
