interface SkeletonCardProps {
    variant?: 'card' | 'list' | 'continue';
}

function SkeletonCard({ variant = 'card' }: SkeletonCardProps) {
    if (variant === 'continue') {
        return (
            <div className="flex-shrink-0 w-72 bg-white/5 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/10" />
                <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-2 bg-white/10 rounded-full w-full mt-3" />
                </div>
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className="flex gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
                <div className="w-12 h-16 bg-white/10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-white/10" />
            <div className="p-3 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
        </div>
    );
}

interface SkeletonSectionProps {
    title?: string;
    count?: number;
    variant?: 'grid' | 'slider' | 'continue' | 'sidebar';
}

export function SkeletonSection({ count = 6, variant = 'grid' }: SkeletonSectionProps) {
    if (variant === 'continue') {
        return (
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-56 bg-white/10 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: count }).map((_, i) => (
                        <SkeletonCard key={i} variant="continue" />
                    ))}
                </div>
            </section>
        );
    }

    if (variant === 'sidebar') {
        return (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="h-6 w-28 bg-white/10 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                    {Array.from({ length: count }).map((_, i) => (
                        <SkeletonCard key={i} variant="list" />
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'slider') {
        return (
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
                            <div className="h-3 w-56 bg-white/10 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: count }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-48">
                                <SkeletonCard />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-56 bg-white/10 rounded animate-pulse" />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </section>
    );
}

// Full page skeleton for Home
export function HomePageSkeleton() {
    return (
        <main className="min-h-screen bg-[#0F0F1A]">
            {/* Hero Skeleton */}
            <div className="relative h-[70vh] bg-gradient-to-b from-white/5 to-transparent animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 px-4">
                        <div className="h-10 w-64 bg-white/10 rounded mx-auto" />
                        <div className="h-6 w-96 bg-white/10 rounded mx-auto" />
                        <div className="flex gap-3 justify-center mt-6">
                            <div className="h-12 w-32 bg-white/10 rounded-xl" />
                            <div className="h-12 w-32 bg-white/10 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="relative z-10 bg-[#0F0F1A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0 space-y-10 lg:space-y-12">
                            <SkeletonSection title="Anime Ongoing" variant="slider" count={6} />
                            <SkeletonSection title="Update Terbaru" variant="grid" count={8} />
                            <SkeletonSection title="Jelajahi Anime" variant="grid" count={12} />
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-80 flex-shrink-0">
                            <div className="lg:sticky lg:top-24 space-y-8">
                                <SkeletonSection title="Top Rating" variant="sidebar" count={5} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default SkeletonCard;
