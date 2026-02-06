export function AnimeDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      {/* Hero Skeleton */}
      <div className="relative">
        {/* Banner Skeleton */}
        <div className="absolute inset-0 h-[300px] sm:h-[400px] lg:h-[500px]">
          <div className="w-full h-full bg-white/5 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-[#0F0F1A]/80 to-[#0F0F1A]/30" />
        </div>

        {/* Content Skeleton */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-6">
          {/* Back Button Placeholder */}
          <div className="mb-6">
            <div className="w-24 h-9 bg-white/10 rounded-lg animate-pulse" />
          </div>

          <div className="flex flex-row gap-4 sm:gap-6 lg:gap-8 items-start w-full">
            {/* Poster Skeleton */}
            <div className="relative flex-shrink-0 w-24 sm:w-40 lg:w-56 aspect-[3/4]">
              <div className="absolute -inset-2 sm:-inset-3 rounded-2xl bg-gradient-to-br from-[#6C5DD3]/20 to-transparent blur-2xl opacity-50 animate-pulse" />
              <div className="relative w-full h-full rounded-lg sm:rounded-xl bg-white/10 animate-pulse" />
            </div>

            {/* Info Skeleton */}
            <div className="flex-1 min-w-0 pb-2 sm:pb-4 space-y-3">
              {/* Title */}
              <div className="space-y-2">
                <div className="h-7 sm:h-10 lg:h-14 bg-white/10 rounded w-3/4 animate-pulse" />
                <div className="h-4 sm:h-6 bg-white/10 rounded w-1/2 animate-pulse" />
              </div>

              {/* Meta Tags */}
              <div className="flex gap-2">
                <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse" />
                <div className="w-20 h-6 bg-white/10 rounded-full animate-pulse" />
              </div>

              {/* Info Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                    <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="space-y-1 flex-1">
                      <div className="h-2 bg-white/10 rounded w-8 animate-pulse" />
                      <div className="h-3 bg-white/10 rounded w-12 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Genres */}
              <div className="flex gap-2 flex-wrap">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-6 bg-white/10 rounded-full animate-pulse" />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <div className="w-28 h-10 bg-[#6C5DD3]/30 rounded-xl animate-pulse" />
                <div className="w-24 h-10 bg-white/10 rounded-xl animate-pulse" />
                <div className="w-10 h-10 bg-white/10 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tab Headers */}
        <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-lg w-full sm:w-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 sm:flex-none w-24 h-9 bg-white/10 rounded-md animate-pulse" />
          ))}
        </div>

        {/* Episode Filter Skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
            <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-white/10 rounded-full animate-pulse" />
            <div className="w-32 h-8 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Episode Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-6 h-4 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white/10 rounded-full animate-pulse" />
                <div className="w-12 h-3 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Skeleton */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl space-y-4">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
                    <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnimeDetailSkeleton;
