import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Automatically scrolls to the top of the page when the route changes.
 * This ensures users always start at the top when navigating to a new page.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        const lenis = (window as any).__lenis as { scrollTo?: (target: number, options?: any) => void } | undefined;
        if (lenis?.scrollTo) {
            lenis.scrollTo(0, { immediate: true });
            return;
        }

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto'
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return null; // This component doesn't render anything
}
