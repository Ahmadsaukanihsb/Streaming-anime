import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '@/config/api';
import { 
  Clock, 
  Save, 
  Copy, 
  Trash2, 
  Search,
  FastForward,
  X,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import {
  getAllSkipTimes,
  saveSkipTimes,
  bulkSaveSkipTimes,
  deleteSkipTimes,
  copySkipTimes,
  type SkipTimeData
} from '@/services/skiptimes';

const logger = createLogger('SkipTimesManager');

interface Anime {
  id: string;
  title: string;
  poster?: string;
  episodes?: number;
  malId?: number;
}

interface EpisodeSkipTime {
  episodeNumber: number;
  op: SkipTimeData;
  ed: SkipTimeData;
  duration: number;
}

export default function SkipTimesManager() {
  useApp(); // Check auth
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeSkipTime[]>([]);
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [opStart, setOpStart] = useState(0);
  const [opEnd, setOpEnd] = useState(85);
  const [edStart, setEdStart] = useState<number>(0);
  const [edEnd, setEdEnd] = useState<number>(0);
  const [duration, setDuration] = useState(1440); // 24 minutes default

  // Bulk edit state
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkEnd, setBulkEnd] = useState(1);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Fetch anime list
  useEffect(() => {
    fetchAnimeList();
  }, []);

  const fetchAnimeList = async () => {
    try {
      const response = await apiFetch(`${BACKEND_URL}/api/anime/custom`);
      if (response.ok) {
        const data = await response.json();
        setAnimeList(data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch anime list:', error);
    }
  };

  // Load skip times when anime selected
  useEffect(() => {
    if (selectedAnime) {
      loadSkipTimes();
    }
  }, [selectedAnime]);

  const loadSkipTimes = async () => {
    if (!selectedAnime) return;
    
    setLoading(true);
    try {
      const data = await getAllSkipTimes(selectedAnime.id);
      setEpisodes(data.episodes || []);
      
      // Load current episode data if exists
      const current = data.episodes.find(e => e.episodeNumber === currentEpisode);
      if (current) {
        setOpStart(current.op?.startTime || 0);
        setOpEnd(current.op?.endTime || 85);
        setEdStart(current.ed?.startTime || 0);
        setEdEnd(current.ed?.endTime || 0);
        setDuration(current.duration || 1440);
      } else {
        // Reset to defaults
        resetForm();
      }
    } catch (error) {
      logger.error('Failed to load skip times:', error);
      showMessage('error', 'Failed to load skip times');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOpStart(0);
    setOpEnd(85);
    setEdStart(0);
    setEdEnd(0);
    setDuration(1440);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedAnime) return;
    
    setSaving(true);
    try {
      // Only include ed if has valid times
      const edData = (edStart > 0 && edEnd > 0) ? {
        startTime: edStart,
        endTime: edEnd
      } : undefined;
      
      await saveSkipTimes({
        animeId: selectedAnime.id,
        episodeNumber: currentEpisode,
        malId: selectedAnime.malId,
        op: { startTime: opStart, endTime: opEnd },
        ...(edData && { ed: edData }),
        duration
      });
      
      showMessage('success', `Saved skip times for episode ${currentEpisode}`);
      loadSkipTimes(); // Refresh
    } catch (error) {
      logger.error('Failed to save:', error);
      showMessage('error', 'Failed to save skip times');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    if (!selectedAnime) return;
    
    setSaving(true);
    try {
      // Only include ed if has valid times
      const edData = (edStart > 0 && edEnd > 0) ? {
        startTime: edStart,
        endTime: edEnd
      } : undefined;
      
      const episodesToSave = [];
      for (let ep = bulkStart; ep <= bulkEnd; ep++) {
        episodesToSave.push({
          episodeNumber: ep,
          op: { startTime: opStart, endTime: opEnd },
          ...(edData && { ed: edData }),
          duration
        });
      }
      
      const result = await bulkSaveSkipTimes(selectedAnime.id, episodesToSave, selectedAnime.malId);
      
      if (result.errors && result.errors.length > 0) {
        showMessage('error', `Saved ${result.saved}/${result.total}, some errors occurred`);
      } else {
        showMessage('success', `Saved skip times for ${result.saved} episodes`);
      }
      
      loadSkipTimes();
      setShowBulkEdit(false);
    } catch (error) {
      logger.error('Failed to bulk save:', error);
      showMessage('error', 'Failed to bulk save skip times');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnime) return;
    
    if (!confirm(`Delete skip times for episode ${currentEpisode}?`)) return;
    
    try {
      await deleteSkipTimes(selectedAnime.id, currentEpisode);
      showMessage('success', 'Skip times deleted');
      resetForm();
      loadSkipTimes();
    } catch (error) {
      logger.error('Failed to delete:', error);
      showMessage('error', 'Failed to delete skip times');
    }
  };

  const handleCopyToNext = async () => {
    if (!selectedAnime) return;
    
    const nextEpisode = currentEpisode + 1;
    if (!confirm(`Copy current skip times to episode ${nextEpisode}?`)) return;
    
    try {
      await copySkipTimes(selectedAnime.id, currentEpisode, [nextEpisode]);
      showMessage('success', `Copied to episode ${nextEpisode}`);
      setCurrentEpisode(nextEpisode);
      loadSkipTimes();
    } catch (error) {
      logger.error('Failed to copy:', error);
      showMessage('error', 'Failed to copy skip times');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredAnime = animeList.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F0F1A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-white/50 hover:text-white text-sm mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Clock className="w-8 h-8 text-[#6C5DD3]" />
              Skip Times Manager
            </h1>
            <p className="text-white/50 mt-1">
              Configure intro/outro skip times for anime episodes
            </p>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Anime Selection */}
          <div className="lg:col-span-1 self-start">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Select Anime
              </h2>
              
              <Input
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white mb-4"
              />
              
              <div 
                className="space-y-2 pr-1" 
                style={{ 
                  height: '300px', 
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y'
                }}
                tabIndex={0}
              >
                {filteredAnime.map((anime) => (
                  <button
                    key={anime.id}
                    onClick={() => {
                      setSelectedAnime(anime);
                      setCurrentEpisode(1);
                      resetForm();
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedAnime?.id === anime.id
                        ? 'bg-[#6C5DD3] text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {/* Poster */}
                    <div className="w-12 h-16 rounded-lg bg-black/30 overflow-hidden flex-shrink-0">
                      {anime.poster ? (
                        <img 
                          src={anime.poster} 
                          alt={anime.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Clock className="w-5 h-5 opacity-30" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium truncate">{anime.title}</p>
                      <p className="text-xs opacity-70">
                        {anime.episodes || '?'} episodes
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Episode List */}
            {selectedAnime && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mt-4">
                <h2 className="text-white font-semibold mb-4">Episodes</h2>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: selectedAnime.episodes || 24 }, (_, i) => i + 1).map((ep) => {
                    const hasData = episodes.find(e => e.episodeNumber === ep);
                    return (
                      <button
                        key={ep}
                        onClick={() => {
                          setCurrentEpisode(ep);
                          const data = episodes.find(e => e.episodeNumber === ep);
                          if (data) {
                            setOpStart(data.op?.startTime || 0);
                            setOpEnd(data.op?.endTime || 85);
                            setEdStart(data.ed?.startTime || 0);
                            setEdEnd(data.ed?.endTime || 0);
                            setDuration(data.duration || 1440);
                          } else {
                            resetForm();
                          }
                        }}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                          currentEpisode === ep
                            ? 'bg-[#6C5DD3] text-white'
                            : hasData
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {ep}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {selectedAnime ? (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {/* Poster */}
                    <div className="w-16 h-24 rounded-xl bg-black/30 overflow-hidden flex-shrink-0">
                      {selectedAnime.poster ? (
                        <img 
                          src={selectedAnime.poster} 
                          alt={selectedAnime.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Clock className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>
                    {/* Title */}
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedAnime.title}</h2>
                      <p className="text-white/50">Episode {currentEpisode}</p>
                      {selectedAnime.malId && (
                        <p className="text-xs text-white/30 mt-1">MAL ID: {selectedAnime.malId}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowBulkEdit(!showBulkEdit)}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <FastForward className="w-4 h-4 mr-2" />
                      Bulk Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyToNext}
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Next
                    </Button>
                  </div>
                </div>

                {/* Bulk Edit Panel */}
                <AnimatePresence>
                  {showBulkEdit && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#6C5DD3]/10 rounded-xl p-4 mb-6 border border-[#6C5DD3]/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium">Apply to Multiple Episodes</h3>
                        <button onClick={() => setShowBulkEdit(false)}>
                          <X className="w-5 h-5 text-white/50 hover:text-white" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div>
                          <label className="text-white/50 text-sm">From Episode</label>
                          <Input
                            type="number"
                            min={1}
                            max={selectedAnime.episodes || 999}
                            value={bulkStart}
                            onChange={(e) => setBulkStart(parseInt(e.target.value) || 1)}
                            className="bg-white/5 border-white/10 text-white w-24"
                          />
                        </div>
                        <div>
                          <label className="text-white/50 text-sm">To Episode</label>
                          <Input
                            type="number"
                            min={bulkStart}
                            max={selectedAnime.episodes || 999}
                            value={bulkEnd}
                            onChange={(e) => setBulkEnd(parseInt(e.target.value) || bulkStart)}
                            className="bg-white/5 border-white/10 text-white w-24"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleBulkSave}
                        disabled={saving}
                        className="bg-[#6C5DD3] hover:bg-[#5a4ec0]"
                      >
                        {saving ? 'Saving...' : `Apply to Episodes ${bulkStart}-${bulkEnd}`}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Opening Settings */}
                <div className="mb-8">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FastForward className="w-5 h-5 text-[#FF6B6B]" />
                    Opening (Intro)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-sm block mb-2">Start Time (seconds)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={opStart}
                          onChange={(e) => setOpStart(parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-white/50 text-sm w-16">{formatTime(opStart)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/50 text-sm block mb-2">End Time (seconds)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={opEnd}
                          onChange={(e) => setOpEnd(parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-white/50 text-sm w-16">{formatTime(opEnd)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ending Settings */}
                <div className="mb-8">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <FastForward className="w-5 h-5 text-[#FFE66D]" />
                    Ending
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-sm block mb-2">Start Time (seconds)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={edStart}
                          onChange={(e) => setEdStart(parseInt(e.target.value) || 0)}
                          placeholder="0 if no ending"
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-white/50 text-sm w-16">
                          {edStart === 0 ? '-' : formatTime(edStart)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/50 text-sm block mb-2">End Time (seconds)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={edEnd}
                          onChange={(e) => setEdEnd(parseInt(e.target.value) || 0)}
                          placeholder="0 if no ending"
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-white/50 text-sm w-16">
                          {edEnd === 0 ? '-' : formatTime(edEnd)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-8">
                  <label className="text-white/50 text-sm block mb-2">Episode Duration (seconds)</label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={0}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white w-32"
                    />
                    <span className="text-white/50">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-black/30 rounded-xl p-4 mb-6">
                  <h4 className="text-white/70 text-sm mb-3">Preview Timeline</h4>
                  <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
                    {/* Opening marker */}
                    <div 
                      className="absolute top-0 bottom-0 bg-[#FF6B6B]/80"
                      style={{
                        left: `${(opStart / duration) * 100}%`,
                        width: `${((opEnd - opStart) / duration) * 100}%`
                      }}
                    />
                    {/* Ending marker */}
                    {edStart > 0 && edEnd > 0 && (
                      <div 
                        className="absolute top-0 bottom-0 bg-[#FFE66D]/80"
                        style={{
                          left: `${(Number(edStart) / duration) * 100}%`,
                          width: `${((Number(edEnd) - Number(edStart)) / duration) * 100}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-white/30 text-xs mt-1">
                    <span>0:00</span>
                    <span>{formatTime(duration / 2)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-[#6C5DD3] hover:bg-[#5a4ec0]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Skip Times'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
                <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Select an Anime</h3>
                <p className="text-white/50">Choose an anime from the list to configure skip times</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
