import { apiFetch } from '@/lib/api';
import { BACKEND_URL } from '@/config/api';

export interface SkipTimeData {
    startTime: number;
    endTime: number;
}

export interface Marker {
    time: number;
    label: string;
    color?: string;
}

export interface SkipTimes {
    found: boolean;
    op?: SkipTimeData;
    ed?: SkipTimeData;
    markers?: Marker[];
    source?: string;
    duration?: number;
}

export interface SkipTimeInput {
    animeId: string;
    episodeNumber: number;
    malId?: number;
    op?: SkipTimeData;
    ed?: SkipTimeData;
    markers?: Marker[];
    duration?: number;
}

export interface BulkEpisodeInput {
    episodeNumber: number;
    op?: SkipTimeData;
    ed?: SkipTimeData;
    markers?: Marker[];
    duration?: number;
}

/**
 * Get skip times for a specific anime episode
 */
export async function getSkipTimes(animeId: string, episodeNumber: number): Promise<SkipTimes> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/skip-times/${animeId}/${episodeNumber}`);
        if (!response.ok) {
            throw new Error('Failed to fetch skip times');
        }
        return await response.json();
    } catch (error) {
        console.error('[SkipTimes] Get error:', error);
        return {
            found: false,
            op: { startTime: 0, endTime: 85 },
            ed: { startTime: 0, endTime: 0 },
            markers: []
        };
    }
}

/**
 * Get all skip times for an anime
 */
export async function getAllSkipTimes(animeId: string): Promise<{ animeId: string; episodes: Array<{
    episodeNumber: number;
    op: SkipTimeData;
    ed: SkipTimeData;
    markers: Marker[];
    source: string;
    duration: number;
}> }> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/skip-times/${animeId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch skip times');
        }
        return await response.json();
    } catch (error) {
        console.error('[SkipTimes] Get all error:', error);
        return { animeId, episodes: [] };
    }
}

/**
 * Save skip times for an episode (Admin only)
 */
export async function saveSkipTimes(data: SkipTimeInput): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${BACKEND_URL}/api/skip-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save skip times');
    }

    return await response.json();
}

/**
 * Bulk save skip times for multiple episodes (Admin only)
 */
export async function bulkSaveSkipTimes(
    animeId: string,
    episodes: BulkEpisodeInput[],
    malId?: number
): Promise<{ success: boolean; total: number; saved: number; errors?: any[] }> {
    const response = await apiFetch(`${BACKEND_URL}/api/skip-times/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId, episodes, malId })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk save skip times');
    }

    return await response.json();
}

/**
 * Delete skip times for an episode (Admin only)
 */
export async function deleteSkipTimes(animeId: string, episodeNumber: number): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${BACKEND_URL}/api/skip-times/${animeId}/${episodeNumber}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete skip times');
    }

    return await response.json();
}

/**
 * Copy skip times from one episode to others (Admin only)
 */
export async function copySkipTimes(
    sourceAnimeId: string,
    sourceEpisode: number,
    targetEpisodes: number[]
): Promise<{ success: boolean; message: string; episodes: number[] }> {
    const response = await apiFetch(`${BACKEND_URL}/api/skip-times/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceAnimeId, sourceEpisode, targetEpisodes })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to copy skip times');
    }

    return await response.json();
}
