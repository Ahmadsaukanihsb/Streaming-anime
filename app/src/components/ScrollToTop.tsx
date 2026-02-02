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
        // Scroll to top immediately on route change
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Use 'instant' for immediate scroll, 'smooth' for animated
        });
    }, [pathname]);

    return null; // This component doesn't render anything
}
