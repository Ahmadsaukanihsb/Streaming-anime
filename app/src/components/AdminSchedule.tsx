import { useMemo, useState } from 'react';
import type { Anime } from '@/data/animeData';
import { Button } from '@/components/ui/button';
import { Calendar, Search, Loader2, CheckCircle2, XCircle, LayoutList } from 'lucide-react';

type ScheduleDraft = {
  hari: string;
  jam: string;
};

type AdminScheduleProps = {
  animeList: Anime[];
  updateAnime: (id: string, updates: Partial<Anime>) => Promise<void> | void;
  showToast: (message: string, type?: 'success' | 'error') => void;
};

const dayOptions = [
  { value: '', label: 'Tidak ada jadwal' },
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
  { value: 'Minggu', label: 'Minggu' },
];

export default function AdminSchedule({ animeList, updateAnime, showToast }: AdminScheduleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ongoing' | 'Completed' | 'unscheduled'>('Ongoing');
  const [drafts, setDrafts] = useState<Record<string, ScheduleDraft>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const stats = useMemo(() => {
    const ongoing = animeList.filter((anime) => anime.status === 'Ongoing');
    const scheduled = ongoing.filter((anime) => anime.jadwalRilis?.hari);
    return {
      total: animeList.length,
      ongoing: ongoing.length,
      scheduled: scheduled.length,
      unscheduled: Math.max(ongoing.length - scheduled.length, 0),
    };
  }, [animeList]);

  const scheduleList = useMemo(() => {
    const filtered = animeList.filter((anime) => {
      const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unscheduled'
          ? anime.status === 'Ongoing' && !anime.jadwalRilis?.hari
          : anime.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }, [animeList, searchQuery, statusFilter]);

  const getBaseSchedule = (anime: Anime): ScheduleDraft => ({
    hari: anime.jadwalRilis?.hari || '',
    jam: anime.jadwalRilis?.jam || '',
  });

  const getDraft = (anime: Anime): ScheduleDraft => drafts[anime.id] || getBaseSchedule(anime);

  const isDirty = (anime: Anime) => {
    const draft = drafts[anime.id];
    if (!draft) return false;
    const base = getBaseSchedule(anime);
    return draft.hari !== base.hari || draft.jam !== base.jam;
  };

  const updateDraft = (anime: Anime, patch: Partial<ScheduleDraft>) => {
    setDrafts((prev) => {
      const base = prev[anime.id] || getBaseSchedule(anime);
      const next = { ...base, ...patch };
      if (!next.hari) {
        next.jam = '';
      }
      return { ...prev, [anime.id]: next };
    });
  };

  const validateDraft = (draft: ScheduleDraft, animeTitle: string) => {
    if (draft.hari && !draft.jam) {
      showToast(`Isi jam rilis untuk ${animeTitle}`, 'error');
      return false;
    }
    return true;
  };

  const handleSave = async (anime: Anime) => {
    const draft = getDraft(anime);
    if (!validateDraft(draft, anime.title)) return;

    setSavingIds((prev) => ({ ...prev, [anime.id]: true }));
    try {
      await updateAnime(anime.id, {
        jadwalRilis: {
          hari: draft.hari || '',
          jam: draft.hari ? draft.jam : '',
        },
      });

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[anime.id];
        return next;
      });
      showToast(`Jadwal ${anime.title} disimpan!`, 'success');
    } finally {
      setSavingIds((prev) => {
        const next = { ...prev };
        delete next[anime.id];
        return next;
      });
    }
  };

  const handleSaveAll = async () => {
    const dirtyAnime = scheduleList.filter(isDirty);
    if (dirtyAnime.length === 0) return;

    for (const anime of dirtyAnime) {
      const draft = getDraft(anime);
      if (!validateDraft(draft, anime.title)) return;
    }

    setIsBulkSaving(true);
    try {
      for (const anime of dirtyAnime) {
        const draft = getDraft(anime);
        await updateAnime(anime.id, {
          jadwalRilis: {
            hari: draft.hari || '',
            jam: draft.hari ? draft.jam : '',
          },
        });
      }
      setDrafts((prev) => {
        const next = { ...prev };
        dirtyAnime.forEach((anime) => delete next[anime.id]);
        return next;
      });
      showToast(`Jadwal diperbarui untuk ${dirtyAnime.length} anime`, 'success');
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6C5DD3]" />
            Kelola Jadwal
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Atur hari dan jam rilis untuk anime ongoing tanpa membuka detail anime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs lg:justify-end">
          <span className="px-3 py-1 rounded-full bg-white/5 text-white/70">
            Total: {stats.total}
          </span>
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-300">
            Ongoing: {stats.ongoing}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300">
            Terjadwal: {stats.scheduled}
          </span>
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-300">
            Belum: {stats.unscheduled}
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <div className="relative min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Cari anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'Ongoing', 'Completed', 'unscheduled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${statusFilter === status
                    ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                >
                  {status === 'all' ? 'Semua' : status === 'unscheduled' ? 'Belum Dijadwalkan' : status}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCompact((prev) => !prev)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all border ${isCompact
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                type="button"
              >
                <span className="inline-flex items-center gap-1.5">
                  <LayoutList className="w-3.5 h-3.5" />
                  Compact
                </span>
              </button>
              <Button
                onClick={handleSaveAll}
                disabled={isBulkSaving || scheduleList.every((anime) => !isDirty(anime))}
                className="bg-[#6C5DD3] hover:bg-[#5a4ec0]"
                size="sm"
              >
                {isBulkSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Simpan Semua
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 grid gap-3 lg:gap-4 xl:grid-cols-2">
          {scheduleList.length === 0 && (
            <div className="text-center py-12 text-white/40 xl:col-span-2">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada anime yang cocok dengan filter saat ini.</p>
            </div>
          )}

          {scheduleList.map((anime) => {
            const draft = getDraft(anime);
            const dirty = isDirty(anime);
            const saving = savingIds[anime.id] === true;

            return (
              <div
                key={anime.id}
                className={`grid gap-4 lg:grid-cols-[minmax(220px,1.4fr)_minmax(200px,1fr)] 2xl:grid-cols-[minmax(240px,2fr)_minmax(220px,1.2fr)_minmax(180px,0.8fr)] lg:items-center bg-white/5 border border-white/10 rounded-xl h-full ${isCompact ? 'p-3' : 'p-4'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className={`${isCompact ? 'w-12 h-16' : 'w-14 h-20'} object-cover rounded-lg flex-shrink-0`}
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className={`text-white font-medium truncate ${isCompact ? 'text-sm' : 'text-base'}`} title={anime.title}>
                      {anime.title}
                    </p>
                    <div className={`flex items-center gap-2 text-xs text-white/50 ${isCompact ? 'mt-0.5' : 'mt-1'}`}>
                      <span className={`px-2 py-0.5 rounded-full ${anime.status === 'Ongoing'
                        ? 'bg-green-500/10 text-green-300'
                        : 'bg-blue-500/10 text-blue-300'
                        }`}>
                        {anime.status}
                      </span>
                      <span>{anime.episodes || 0} Episode</span>
                      {anime.jadwalRilis?.hari && (
                        <span className="text-white/40">· {anime.jadwalRilis.hari} {anime.jadwalRilis.jam || '??:??'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={draft.hari}
                    onChange={(e) => updateDraft(anime, { hari: e.target.value })}
                    className={`w-full px-3 ${isCompact ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-[#0F0F1A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#6C5DD3]`}
                  >
                    {dayOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1A1A2E]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={draft.jam}
                    onChange={(e) => updateDraft(anime, { jam: e.target.value })}
                    disabled={!draft.hari}
                    className={`w-full px-3 ${isCompact ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-[#0F0F1A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#6C5DD3] disabled:opacity-50`}
                  />
                </div>

                <div className="flex items-center justify-between lg:justify-between 2xl:justify-end gap-3 lg:col-span-2 2xl:col-span-1">
                  <span className={`text-xs ${dirty ? 'text-orange-300' : 'text-emerald-300'} flex items-center gap-1`}>
                    {dirty ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {dirty ? 'Belum disimpan' : 'Tersimpan'}
                  </span>
                  <Button
                    onClick={() => handleSave(anime)}
                    disabled={!dirty || saving}
                    size="sm"
                    className={`bg-[#6C5DD3] hover:bg-[#5a4ec0] ${isCompact ? 'h-8 px-3 text-xs' : ''}`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
