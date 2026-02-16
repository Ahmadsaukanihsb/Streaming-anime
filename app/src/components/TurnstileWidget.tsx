import { Turnstile } from '@marsidev/react-turnstile';
import { useState, useEffect } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

// Check if running on localhost/development
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Auto-verify in development mode
  useEffect(() => {
    if (isDevelopment && !isVerified) {
      // Auto-verify with dummy token for localhost
      setIsVerified(true);
      onVerify('dev-token-localhost');
    }
  }, [onVerify, isVerified]);

  // Don't render Turnstile in development (auto-verified)
  if (isDevelopment) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm">✓ Development Mode (Auto-verified)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Turnstile
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={(token) => {
          setError(null);
          onVerify(token);
        }}
        onError={() => {
          setError('Verifikasi gagal. Silakan coba lagi.');
        }}
        onExpire={() => {
          onExpire?.();
          setError('Verifikasi expired. Silakan verifikasi ulang.');
        }}
        options={{
          theme: 'dark',
          size: 'normal',
        }}
      />
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}
