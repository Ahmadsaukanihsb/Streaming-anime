import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  PlaySquare,
  Users,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  Star,
  LogOut,
  Download,
  Loader2,
  CheckCircle2,
  Check,
  XCircle,
  X,
  CloudUpload,
  Upload,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Shuffle,
  Calendar,
  TrendingUp,
  Tag,
  BarChart3,
  ImageIcon,
  Shield,
  Captions,
  Award,
  Menu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { API_CONFIG, getApiUrl, BACKEND_URL } from '../config/api';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { DEFAULT_SITE_NAME } from '../config/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AdminStats from '@/components/AdminStats';
import AdminModeration from '@/components/AdminModeration';
import AdminUsers from '@/components/AdminUsers';
import AdminBadges from '@/components/AdminBadges';
import AdminSchedule from '@/components/AdminSchedule';
import SafeAvatar from '@/components/SafeAvatar';


export default function Admin() {
  const { user, logout, animeList, addAnime, updateAnime, deleteAnime } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Site Settings State
  const [siteName, setSiteName] = useState(() => localStorage.getItem('siteName') || DEFAULT_SITE_NAME);
  const [siteDescription, setSiteDescription] = useState(() => localStorage.getItem('siteDescription') || 'Platform streaming anime terbaik');
  const [siteEmail, setSiteEmail] = useState(() => localStorage.getItem('siteEmail') || 'support@animeku.xyz');
  const [siteLogo, setSiteLogo] = useState(() => localStorage.getItem('siteLogo') || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Logo Upload State
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  
  // Handle logo file upload
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('File harus berupa gambar (PNG, JPG, GIF, WEBP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('Ukuran file maksimal 2MB');
      return;
    }
    
    setLogoUploadError('');
    setIsUploadingLogo(true);
    
    try {
      // Generate timestamp for unique filename
      const timestamp = Date.now();
      
      // Get presigned URL from backend
      const response = await apiFetch(`${BACKEND_URL}/api/upload/presign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          animeTitle: 'site-assets',
          episode: timestamp,
          quality: 'logo',
          contentType: file.type
        })
      });
      
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await response.json();
      
      // Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!uploadResponse.ok) throw new Error('Upload failed');
      
      // Set the logo URL
      setSiteLogo(publicUrl);
      alert('Logo berhasil diupload!');
    } catch (error) {
      console.error('Logo upload error:', error);
      setLogoUploadError('Gagal upload logo. Coba lagi.');
    } finally {
      setIsUploadingLogo(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ongoing' | 'Completed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<any>(null);
  const [apiSearchResults, setApiSearchResults] = useState<any[]>([]);

  // Episode Management State
  const [selectedAnimeForEpisodes, setSelectedAnimeForEpisodes] = useState<any>(null);
  const [episodeToEdit, setEpisodeToEdit] = useState<any>(null);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [streamServer, setStreamServer] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamQuality, setStreamQuality] = useState('1080p');
  const [streamType, setStreamType] = useState('embed');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');

  // Video Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadQuality, setUploadQuality] = useState('720p');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Batch Upload State
  interface BatchFile {
    file: File;
    episodeNumber: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    progress: number;
    error?: string;
  }
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [batchQuality, setBatchQuality] = useState('720p');
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [, setBatchCurrentIndex] = useState(0);

  // Subtitle Generation State
  const [subtitleProvider, setSubtitleProvider] = useState<'openai' | 'local'>('openai');
  const [subtitleLanguage, setSubtitleLanguage] = useState<string | null>(null);
  const [isGeneratingSubtitle, setIsGeneratingSubtitle] = useState(false);
  const [generatingEpisode, setGeneratingEpisode] = useState<number | null>(null);
  const [subtitleProgress, setSubtitleProgress] = useState<string>('');

  // Sidebar Widget Configuration State
  interface SidebarWidget {
    id: string;
    name: string;
    enabled: boolean;
    order: number;
  }
  interface HomeSection {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
  }
  const defaultWidgets: SidebarWidget[] = [
    { id: 'random', name: 'Tombol Anime Random', enabled: true, order: 0 },
    { id: 'stats', name: 'Statistik User', enabled: true, order: 1 },
    { id: 'schedule', name: 'Jadwal Rilis', enabled: true, order: 2 },
    { id: 'topRating', name: 'Top Rating', enabled: true, order: 3 },
    { id: 'genres', name: 'Genre Populer', enabled: true, order: 4 },
  ];
  const defaultHomeSections: HomeSection[] = [
    { id: 'trending', name: 'Trending Minggu Ini', description: 'Anime terpopuler minggu ini', enabled: true },
    { id: 'continue', name: 'Lanjutkan Menonton', description: 'Riwayat tontonan user', enabled: true },
    { id: 'ongoing', name: 'Anime Ongoing', description: 'Anime yang sedang tayang', enabled: true },
    { id: 'latest', name: 'Update Terbaru', description: 'Anime yang baru ditambahkan', enabled: true },
    { id: 'explore', name: 'Jelajahi Anime', description: 'Koleksi rekomendasi', enabled: true },
    { id: 'completed', name: 'Anime Selesai', description: 'Anime yang sudah tamat', enabled: false },
  ];
  const [sidebarWidgets, setSidebarWidgets] = useState<SidebarWidget[]>(defaultWidgets);
  const [, setIsLoadingWidgets] = useState(true);
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultHomeSections);
  const [, setIsLoadingHomeSections] = useState(true);

  // Hero Settings State
  const [heroAnimeIds, setHeroAnimeIds] = useState<string[]>([]);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // Load sidebar widgets from database on mount
  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/settings/sidebarWidgets`, {
          headers: { ...getAuthHeaders() }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSidebarWidgets(data);
          }
        } else if (res.status === 404) {
          // First time - save default widgets to database
          console.log('[Admin] No saved widgets found, saving defaults to DB...');
          await apiFetch(`${BACKEND_URL}/api/settings/sidebarWidgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ value: defaultWidgets }),
          });
        }
      } catch (err) {
        console.warn('Failed to load sidebar widgets from DB, using defaults');
      } finally {
        setIsLoadingWidgets(false);
      }
    };
    loadWidgets();
  }, []);

  // Save sidebar widgets to database
  const saveSidebarWidgets = async (widgets: SidebarWidget[]) => {
    setSidebarWidgets(widgets);
    try {
      await apiFetch(`${BACKEND_URL}/api/settings/sidebarWidgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ value: widgets }),
      });
    } catch (err) {
      console.error('Failed to save sidebar widgets to DB:', err);
      showToast('Gagal menyimpan ke database!', 'error');
    }
  };

  // Toggle widget visibility
  const toggleWidget = (id: string) => {
    const updated = sidebarWidgets.map(w =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    saveSidebarWidgets(updated);
    showToast('Widget berhasil diupdate!', 'success');
  };

  // Move widget up/down
  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const idx = sidebarWidgets.findIndex(w => w.id === id);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sidebarWidgets.length) return;

    const updated = [...sidebarWidgets];
    const temp = updated[idx];
    updated[idx] = { ...updated[newIdx], order: idx };
    updated[newIdx] = { ...temp, order: newIdx };

    saveSidebarWidgets(updated.sort((a, b) => a.order - b.order));
  };

  const mergeHomeSections = (data: HomeSection[]) => {
    const map = new Map(defaultHomeSections.map(section => [section.id, section]));
    data.forEach(section => {
      if (section?.id && map.has(section.id)) {
        map.set(section.id, { ...map.get(section.id)!, ...section });
      }
    });
    return Array.from(map.values());
  };

  // Load home sections config from database on mount
  useEffect(() => {
    const loadHomeSections = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/settings/homeSections`, {
          headers: { ...getAuthHeaders() }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHomeSections(mergeHomeSections(data));
          }
        } else if (res.status === 404) {
          await apiFetch(`${BACKEND_URL}/api/settings/homeSections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ value: defaultHomeSections }),
          });
        }
      } catch (err) {
        console.warn('Failed to load home sections, using defaults');
      } finally {
        setIsLoadingHomeSections(false);
      }
    };
    loadHomeSections();
  }, []);

  // Save home sections to database
  const saveHomeSections = async (sections: HomeSection[]) => {
    setHomeSections(sections);
    try {
      await apiFetch(`${BACKEND_URL}/api/settings/homeSections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ value: sections }),
      });
    } catch (err) {
      console.error('Failed to save home sections to DB:', err);
      showToast('Gagal menyimpan home sections!', 'error');
    }
  };

  const toggleHomeSection = (id: string) => {
    const updated = homeSections.map(section =>
      section.id === id ? { ...section, enabled: !section.enabled } : section
    );
    saveHomeSections(updated);
    showToast('Home section berhasil diupdate!', 'success');
  };

  // Load hero settings from database on mount
  useEffect(() => {
    const loadHeroSettings = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/settings/heroAnimeIds`, {
          headers: { ...getAuthHeaders() }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHeroAnimeIds(data);
          }
        }
      } catch (err) {
        console.error('Failed to load hero settings:', err);
      }
    };
    loadHeroSettings();
  }, []);

  // Save hero settings to database
  const saveHeroSettings = async (ids: string[]) => {
    setHeroAnimeIds(ids);
    try {
      await apiFetch(`${BACKEND_URL}/api/settings/heroAnimeIds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ value: ids }),
      });
      showToast('Hero settings saved!', 'success');
    } catch (err) {
      console.error('Failed to save hero settings:', err);
      showToast('Gagal menyimpan hero settings!', 'error');
    }
  };

  // Add anime to hero
  const addToHero = (animeId: string) => {
    if (heroAnimeIds.includes(animeId)) {
      showToast('Anime sudah ada di Hero!', 'error');
      return;
    }
    if (heroAnimeIds.length >= 5) {
      showToast('Maksimal 5 anime di Hero!', 'error');
      return;
    }
    saveHeroSettings([...heroAnimeIds, animeId]);
  };

  // Remove anime from hero
  const removeFromHero = (animeId: string) => {
    saveHeroSettings(heroAnimeIds.filter(id => id !== animeId));
  };

  // Move hero anime up/down
  const moveHeroAnime = (animeId: string, direction: 'up' | 'down') => {
    const idx = heroAnimeIds.indexOf(animeId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= heroAnimeIds.length) return;
    const updated = [...heroAnimeIds];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    saveHeroSettings(updated);
  };

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };


  // Parse episode number from filename
  const parseEpisodeNumber = (filename: string): number => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Common patterns to match
    const patterns = [
      /[Ee]pisode\s*(\d+)/i,        // Episode 01, episode1
      /[Ee][Pp]?\s*(\d+)/i,          // EP01, Ep 1, E01
      /[Ss]\d+[Ee](\d+)/i,           // S01E05
      /[-_\s](\d{1,3})(?:[-_\s]|$)/i,// - 01, _01, space01
      /^(\d{1,3})(?:\s|$)/,          // 01 at start
      /(\d{1,3})$/                   // 01 at end
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > 0 && num <= 999) return num;
      }
    }

    return 1; // Default to episode 1
  };

  // Handle batch file selection
  const handleBatchFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newBatchFiles: BatchFile[] = Array.from(files).map(file => ({
      file,
      episodeNumber: parseEpisodeNumber(file.name),
      status: 'pending' as const,
      progress: 0
    }));

    // Sort by episode number
    newBatchFiles.sort((a, b) => a.episodeNumber - b.episodeNumber);
    setBatchFiles(newBatchFiles);
  };

  // Update episode number for a batch file
  const updateBatchEpisodeNumber = (index: number, episodeNumber: number) => {
    setBatchFiles(prev => prev.map((item, i) =>
      i === index ? { ...item, episodeNumber } : item
    ));
  };

  // Remove file from batch
  const removeBatchFile = (index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all batch files
  const clearBatchFiles = () => {
    setBatchFiles([]);
    setBatchCurrentIndex(0);
  };

  // Handle batch upload (sequential) via presigned URLs
  const handleBatchUpload = async () => {
    if (!selectedAnimeForEpisodes || batchFiles.length === 0) return;

    setIsBatchUploading(true);

    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i];
      if (item.status === 'complete') continue;

      setBatchCurrentIndex(i);
      setBatchFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // Step 1: Get presigned URL
        // Detect content type with fallback for MKV
        let contentType = item.file.type || 'video/mp4';
        const ext = item.file.name.toLowerCase().split('.').pop();
        if (!contentType || contentType === 'application/octet-stream') {
          if (ext === 'mkv') contentType = 'video/x-matroska';
          else if (ext === 'webm') contentType = 'video/webm';
          else if (ext === 'mov') contentType = 'video/quicktime';
          else contentType = 'video/mp4';
        }

        const presignRes = await apiFetch(`${BACKEND_URL}/api/upload/presign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            animeTitle: selectedAnimeForEpisodes.title,
            episode: item.episodeNumber,
            quality: batchQuality,
            contentType: contentType
          })
        });

        const presignData = await presignRes.json();
        if (!presignData.success) {
          throw new Error(presignData.error || 'Failed to get upload URL');
        }

        setBatchFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 5 } : f
        ));

        // Step 2: Upload directly to R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 85) + 5; // 5-90%
              setBatchFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, progress: percent } : f
              ));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.open('PUT', presignData.uploadUrl);
          xhr.setRequestHeader('Content-Type', item.file.type || 'video/mp4');
          xhr.send(item.file);
        });

        // Step 3: Confirm upload
        await apiFetch(`${BACKEND_URL}/api/upload/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            animeId: selectedAnimeForEpisodes.id || selectedAnimeForEpisodes._id,
            animeTitle: selectedAnimeForEpisodes.title,
            episode: item.episodeNumber,
            quality: batchQuality,
            publicUrl: presignData.publicUrl
          })
        });

        setBatchFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'complete', progress: 100 } : f
        ));

        // Update episode data locally with proper React state update
        setSelectedAnimeForEpisodes((prev: any) => {
          if (!prev || !prev.episodeData) return prev;

          const updatedEpisodeData = prev.episodeData.map((ep: any) => {
            if (ep.ep === item.episodeNumber) {
              return {
                ...ep,
                streams: [
                  ...(ep.streams || []),
                  {
                    server: 'R2 Cloud',
                    url: presignData.publicUrl,
                    quality: batchQuality,
                    type: 'direct'
                  }
                ]
              };
            }
            return ep;
          });

          return { ...prev, episodeData: updatedEpisodeData };
        });

      } catch (error: any) {
        setBatchFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: error.message } : f
        ));
      }
    }

    setIsBatchUploading(false);
    showToast(`Batch upload selesai! ${batchFiles.filter(f => f.status === 'complete').length}/${batchFiles.length} berhasil`);
  };

  // Handle video upload to R2 via presigned URL (bypasses Cloudflare Tunnel limit)
  const handleUploadVideo = async () => {
    if (!uploadFile || !selectedAnimeForEpisodes || !episodeToEdit) {
      showToast('Pilih file video terlebih dahulu', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const presignRes = await apiFetch(`${BACKEND_URL}/api/upload/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          animeTitle: selectedAnimeForEpisodes.title,
          episode: episodeToEdit.ep,
          quality: uploadQuality,
          contentType: uploadFile.type || 'video/mp4'
        })
      });

      const presignData = await presignRes.json();
      if (!presignData.success) {
        throw new Error(presignData.error || 'Failed to get upload URL');
      }

      setUploadProgress(10);

      // Step 2: Upload directly to R2 using presigned URL
      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 80) + 10; // 10-90%
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', presignData.uploadUrl);
        xhr.setRequestHeader('Content-Type', uploadFile.type || 'video/mp4');
        xhr.send(uploadFile);
      });

      setUploadProgress(95);

      // Step 3: Confirm upload and update database
      const confirmRes = await apiFetch(`${BACKEND_URL}/api/upload/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          animeId: selectedAnimeForEpisodes.id || selectedAnimeForEpisodes._id,
          animeTitle: selectedAnimeForEpisodes.title,
          episode: episodeToEdit.ep,
          quality: uploadQuality,
          publicUrl: presignData.publicUrl
        })
      });

      const confirmData = await confirmRes.json();
      setUploadProgress(100);

      if (confirmData.success) {
        // Add stream to episode
        const newStream = {
          server: 'R2 Cloud',
          url: presignData.publicUrl,
          quality: uploadQuality,
          type: 'direct'
        };
        const currentStreams = episodeToEdit.streams || [];
        setEpisodeToEdit({ ...episodeToEdit, streams: [...currentStreams, newStream] });
        setUploadFile(null);
        showToast('Video berhasil diupload!', 'success');
      } else {
        showToast(confirmData.error || 'Upload gagal', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat upload', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };


  // Form State
  const [formData, setFormData] = useState({
    id: '' as string | undefined, // For API imports
    title: '',
    studio: '',
    releasedYear: new Date().getFullYear(),
    episodes: 12,
    rating: 0,
    status: 'Ongoing' as 'Ongoing' | 'Completed',
    type: 'TV' as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music',
    synopsis: '',
    poster: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=300&auto=format&fit=crop',
    genres: [] as string[],
    episodeData: [] as any[],
    malId: undefined as number | undefined,
    tmdbId: undefined as number | undefined,
    trailer: '',
    trailerType: 'youtube' as 'youtube' | 'direct',
    jadwalRilis: { hari: '', jam: '' } as { hari: string; jam: string },
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    title: '',
    studio: '',
    releasedYear: new Date().getFullYear(),
    episodes: 12,
    rating: 0,
    status: 'Ongoing' as 'Ongoing' | 'Completed',
    type: 'TV' as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music',
    synopsis: '',
    poster: '',
    genres: [] as string[],
    episodeData: [] as any[],
    malId: undefined as number | undefined,
    tmdbId: undefined as number | undefined,
    trailer: '',
    trailerType: 'youtube' as 'youtube' | 'direct',
    jadwalRilis: { hari: '', jam: '' } as { hari: string; jam: string },
  });

  const handleAddAnime = () => {
    // Check for duplicates
    const isDuplicate = animeList.some(anime =>
      anime.title.toLowerCase() === formData.title.toLowerCase()
    );

    if (isDuplicate) {
      alert('⚠️ Anime dengan judul ini sudah ada!');
      return;
    }

    addAnime({
      ...formData,
    });
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      id: undefined,
      title: '',
      studio: '',
      releasedYear: new Date().getFullYear(),
      episodes: 12,
      rating: 0,
      status: 'Ongoing',
      type: 'TV',
      synopsis: '',
      poster: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=300&auto=format&fit=crop',
      genres: [],
      episodeData: [],
      malId: undefined,
      tmdbId: undefined,
      trailer: '',
      trailerType: 'youtube',
      jadwalRilis: { hari: '', jam: '' },
    });
  };

  const handleEditAnime = (anime: any) => {
    setEditingAnime(anime);
    setEditFormData({
      title: anime.title,
      studio: anime.studio,
      releasedYear: anime.releasedYear,
      episodes: anime.episodes,
      rating: anime.rating,
      status: anime.status,
      type: anime.type || 'TV',
      synopsis: anime.synopsis,
      poster: anime.poster,
      genres: anime.genres,
      episodeData: anime.episodeData || [],
      malId: anime.malId,
      tmdbId: anime.tmdbId,
      trailer: anime.trailer || '',
      trailerType: anime.trailerType || 'youtube',
      jadwalRilis: anime.jadwalRilis || { hari: '', jam: '' },
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAnime = () => {
    if (editingAnime) {
      updateAnime(editingAnime.id, editFormData);
      setIsEditModalOpen(false);
      setEditingAnime(null);
    }
  };

  const handleSaveEpisode = async () => {
    if (!selectedAnimeForEpisodes || !episodeToEdit) return;

    // Update anime's episode list
    const updatedEpisodes = [...(selectedAnimeForEpisodes.episodeData || [])];
    // Find index by 'ep' (number)
    const idx = updatedEpisodes.findIndex(e => e.ep === episodeToEdit.ep);

    if (idx >= 0) {
      updatedEpisodes[idx] = episodeToEdit;
    } else {
      updatedEpisodes.push(episodeToEdit);
    }

    // Construct full anime update object
    const updatedAnime = { ...selectedAnimeForEpisodes, episodeData: updatedEpisodes };

    console.log('[Admin] Saving episode data:', episodeToEdit);
    console.log('[Admin] Updated episodes array:', updatedEpisodes);

    // Call context update - this calls PUT /api/anime/:id
    await updateAnime(updatedAnime.id, { episodeData: updatedEpisodes });

    // Update local state
    setSelectedAnimeForEpisodes(updatedAnime);
    setEpisodeToEdit(null);
    setIsEpisodeModalOpen(false);
    showToast('Episode berhasil disimpan!', 'success');
  };

  const handleAddStream = () => {
    if (!streamUrl || !streamServer) return;
    const newStream = { server: streamServer, url: streamUrl, quality: streamQuality, type: streamType };
    const currentStreams = episodeToEdit.streams || [];
    setEpisodeToEdit({ ...episodeToEdit, streams: [...currentStreams, newStream] });
    setStreamUrl('');
    setStreamServer('');
  };

  const handleDeleteStream = (idx: number) => {
    const s = [...(episodeToEdit.streams || [])];
    s.splice(idx, 1);
    setEpisodeToEdit({ ...episodeToEdit, streams: s });
  };

  const openEpisodeEdit = (ep: any) => {
    // Ensure streams array exists
    setEpisodeToEdit({ ...ep, streams: ep.streams || [] });
    setIsEpisodeModalOpen(true);
  };

  const createNewEpisode = () => {
    // Find next episode number
    const existing = selectedAnimeForEpisodes?.episodeData || [];
    const nextEp = existing.length > 0 ? Math.max(...existing.map((e: any) => e.ep)) + 1 : 1;

    setEpisodeToEdit({
      ep: nextEp,
      title: `Episode ${nextEp}`,
      releaseDate: new Date().toISOString().split('T')[0],
      streams: []
    });
    setIsEpisodeModalOpen(true);
  };

  // Scrape episodes from scrapers
  const handleScrapeEpisodes = async () => {
    if (!selectedAnimeForEpisodes) return;

    setIsScraping(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/anime/scrape-episodes/${selectedAnimeForEpisodes.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          url: scrapeUrl || undefined,
          animeData: selectedAnimeForEpisodes  // Send full anime data for auto-creation if not in DB
        })
      });

      const data = await res.json();

      if (data.success) {
        // Create updated anime object
        const updatedAnime = {
          ...selectedAnimeForEpisodes,
          episodeData: data.episodes,
          episodes: data.episodesCount || selectedAnimeForEpisodes.episodes
        };

        // Update global animeList state (so it persists when navigating back)
        updateAnime(selectedAnimeForEpisodes.id, updatedAnime);

        // Update local state for immediate UI update
        setSelectedAnimeForEpisodes(updatedAnime);

        showToast(`${data.message}`, 'success');
      } else {
        showToast(`Gagal: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Scrape error:', err);
      showToast('Gagal scrape episode. Periksa console untuk detail.', 'error');
    } finally {
      setIsScraping(false);
      setScrapeUrl(''); // Clear URL after scrape
    }
  };

  // Generate subtitle for an episode using AI
  const handleGenerateSubtitle = async (episodeNum: number) => {
    console.log('[Subtitle] handleGenerateSubtitle called for episode:', episodeNum);
    console.log('[Subtitle] selectedAnimeForEpisodes:', selectedAnimeForEpisodes);

    if (!selectedAnimeForEpisodes) {
      console.error('[Subtitle] No anime selected!');
      showToast('Pilih anime terlebih dahulu', 'error');
      return;
    }

    setIsGeneratingSubtitle(true);
    setGeneratingEpisode(episodeNum);
    setSubtitleProgress('Memulai proses...');

    try {
      console.log('[Subtitle] Calling API...');

      // Show progress stages
      setSubtitleProgress('⏳ Mengekstrak audio dari video...');

      const res = await apiFetch(`${BACKEND_URL}/api/anime/${selectedAnimeForEpisodes.id}/episode/${episodeNum}/generate-subtitle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          provider: subtitleProvider,
          language: subtitleLanguage,
          translate: subtitleLanguage === 'id', // Translate if target is Indonesian
          model: 'large-v3'
        })
      });

      const data = await res.json();

      if (data.success) {
        // Update the episode data with subtitle info
        const updatedEpisodeData = selectedAnimeForEpisodes.episodeData.map((ep: any) =>
          ep.ep === episodeNum ? { ...ep, subtitle: data.subtitle } : ep
        );

        const updatedAnime = {
          ...selectedAnimeForEpisodes,
          episodeData: updatedEpisodeData
        };

        updateAnime(selectedAnimeForEpisodes.id, updatedAnime);
        setSelectedAnimeForEpisodes(updatedAnime);
        setSubtitleProgress('✅ Selesai!');

        showToast(`Subtitle berhasil dibuat untuk Episode ${episodeNum}!`, 'success');
      } else {
        showToast(`Gagal: ${data.error}`, 'error');
      }
    } catch (err: any) {
      console.error('Subtitle generation error:', err);
      showToast(`Error: ${err.message || 'Gagal generate subtitle'}`, 'error');
    } finally {
      setIsGeneratingSubtitle(false);
      setGeneratingEpisode(null);
      setTimeout(() => setSubtitleProgress(''), 3000);
    }
  };

  // Handle delete subtitle
  const handleDeleteSubtitle = async (episodeNum: number) => {
    if (!selectedAnimeForEpisodes) return;

    if (!confirm(`Hapus subtitle Episode ${episodeNum}?`)) return;

    try {
      const res = await apiFetch(`${BACKEND_URL}/api/anime/${selectedAnimeForEpisodes.id}/episode/${episodeNum}/subtitle`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });

      const data = await res.json();

      if (data.success) {
        // Update the episode data to remove subtitle
        const updatedEpisodeData = selectedAnimeForEpisodes.episodeData.map((ep: any) =>
          ep.ep === episodeNum ? { ...ep, subtitle: undefined } : ep
        );

        const updatedAnime = {
          ...selectedAnimeForEpisodes,
          episodeData: updatedEpisodeData
        };

        updateAnime(selectedAnimeForEpisodes.id, updatedAnime);
        setSelectedAnimeForEpisodes(updatedAnime);

        showToast(`Subtitle Episode ${episodeNum} berhasil dihapus!`, 'success');
      } else {
        showToast(`Gagal: ${data.error}`, 'error');
      }
    } catch (err: any) {
      console.error('Delete subtitle error:', err);
      showToast(`Error: ${err.message || 'Gagal hapus subtitle'}`, 'error');
    }
  };

  // Filter anime based on search and status
  const filteredAnime = animeList.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || anime.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Akses Ditolak</h1>
          <p className="text-white/50 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini</p>
          <Link to="/" className="btn-primary">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex">
      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${toast.type === 'success'
            ? 'bg-green-500/20 border-green-500/30 text-green-400'
            : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 flex-shrink-0" />
          )}
          <span className="text-white font-medium">{toast.message}</span>
          <button
            onClick={() => setToast({ ...toast, show: false })}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-gradient-to-b from-[#1A1A2E] to-[#12121F] border-r border-white/5 fixed h-full z-40 transition-transform duration-300 overflow-hidden flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} data-lenis-prevent>
        <div className="flex-1 overflow-y-auto p-6 pb-2 admin-sidebar-scroll">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20 group-hover:shadow-[#6C5DD3]/40 transition-shadow overflow-hidden">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="w-full h-full object-cover" />
              ) : (
                <Film className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <span className="text-lg font-bold font-heading text-white">{siteName}</span>
              <span className="block text-xs text-white/40">Admin Panel</span>
            </div>
          </Link>

          {/* Nav Section */}
          <p className="text-xs text-white/30 uppercase tracking-wider mb-2 px-2">Menu</p>
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'anime', label: 'Kelola Anime', icon: Film },
              { id: 'kelola-jadwal', label: 'Kelola Jadwal', icon: Calendar },
              { id: 'add-anime', label: 'Tambah Anime', icon: Plus },
              { id: 'episodes', label: 'Kelola Episode', icon: PlaySquare },
              { id: 'generate-sub', label: 'Generate Subtitle', icon: Captions },
              { id: 'hero', label: 'Kelola Hero', icon: ImageIcon },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === item.id
                  ? 'bg-gradient-to-r from-[#6C5DD3] to-[#6C5DD3]/80 text-white shadow-md shadow-[#6C5DD3]/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Settings Section */}
          <p className="text-xs text-white/30 uppercase tracking-wider mb-2 px-2 mt-6">Lainnya</p>
          <nav className="space-y-1">
            {[
              { id: 'users', label: 'Kelola User', icon: Users },
              { id: 'badges', label: 'Kelola Badge', icon: Award },
              { id: 'moderation', label: 'Moderasi', icon: Shield },
              { id: 'settings', label: 'Pengaturan', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === item.id
                  ? 'bg-gradient-to-r from-[#6C5DD3] to-[#6C5DD3]/80 text-white shadow-md shadow-[#6C5DD3]/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="flex-shrink-0 p-4 border-t border-white/5 bg-[#0F0F1A]">
          <div className="flex items-center gap-2.5 mb-3 p-2 rounded-lg bg-white/5">
            <SafeAvatar
              src={user.avatar}
              name={user.name}
              className="w-9 h-9 rounded-lg ring-2 ring-[#6C5DD3]/50"
              fallbackBgClassName={user.isAdmin ? 'bg-gradient-to-br from-red-500 to-rose-600' : undefined}
              fallbackClassName="text-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{user.name}</p>
              <p className="text-white/50 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Administrator
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 bg-[#0F0F1A]">
        {/* Mobile Header with Menu Button */}
        <div className="flex items-center gap-4 mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
        </div>

        {/* Header (Desktop) */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/40 mb-1">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-white/60 capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <Film className="w-4 h-4 text-[#6C5DD3]" />
              <span className="text-white/70 text-sm">{animeList.length} Anime</span>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-white/50 text-sm">{new Date().toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Live Stats from Database */}
            <AdminStats />
          </motion.div>
        )}

        {/* Anime Management */}
        {activeTab === 'anime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-2 bg-[#1A1A2E] border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === 'all'
                      ? 'bg-[#6C5DD3] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    Semua ({animeList.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('Ongoing')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === 'Ongoing'
                      ? 'bg-green-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    Ongoing ({animeList.filter(a => a.status === 'Ongoing').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('Completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === 'Completed'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    Completed ({animeList.filter(a => a.status === 'Completed').length})
                  </button>
                </div>
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#6C5DD3] hover:bg-[#5a4ec0]">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Anime
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Tambah Anime Baru</DialogTitle>
                  </DialogHeader>

                  {/* API Search Section */}
                  <div className="bg-white/5 p-4 rounded-xl mt-4 border border-white/10">
                    <h3 className="text-white text-sm font-medium mb-3">Impor dari Server</h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Cari judul anime di server..."
                        className="flex-1 px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-xl text-white text-sm focus:border-[#6C5DD3] outline-none"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const query = e.currentTarget.value;
                            if (!query) return;

                            try {
                              console.log('[Admin] Searching for:', query);
                              const url = `${getApiUrl(API_CONFIG.endpoints.search)}?q=${query}`;
                              console.log('[Admin] Search URL:', url);

                              const res = await fetch(url);
                              console.log('[Admin] Response status:', res.status);

                              const data = await res.json();
                              console.log('[Admin] Raw API response:', data);

                              // DramaBos format: { code: 0, data: [...] }
                              const results = data?.data || [];
                              console.log('[Admin] Extracted results:', results);

                              if (Array.isArray(results)) {
                                setApiSearchResults(results);
                                console.log('[Admin] Set results, count:', results.length);
                              } else {
                                console.warn('[Admin] Results not an array:', results);
                                setApiSearchResults([]);
                              }
                            } catch (err) {
                              console.error('[Admin] Search error:', err);
                              setApiSearchResults([]);
                            }
                          }
                        }}
                      />
                      <Button className="bg-white/10 hover:bg-white/20">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Results Container */}
                    {apiSearchResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto space-y-1 bg-[#0F0F1A] rounded-lg p-2 border border-white/5">
                        {apiSearchResults.map((item) => (
                          <div
                            key={item.slug || item.url || Math.random()}
                            className="p-2 hover:bg-white/5 rounded cursor-pointer flex gap-3 items-center transition-colors"
                            onClick={async () => {
                              // Parse release year
                              let year = new Date().getFullYear();
                              if (item.rilis) {
                                const date = new Date(item.rilis);
                                if (!isNaN(date.getFullYear())) {
                                  year = date.getFullYear();
                                }
                              }

                              // Parse status
                              let status: 'Ongoing' | 'Completed' = 'Ongoing';
                              if (item.status === 'Completed') status = 'Completed';

                              // Parse rating
                              let rating = 0;
                              if (item.score) {
                                rating = parseFloat(item.score) || 0;
                              }


                              console.log('[Admin] Selected item:', item);
                              const slug = item.slug || item.url || '';
                              console.log('[Admin] Fetching detail for slug:', slug);

                              // Fetch anime detail to get episode data and metadata
                              let episodeData: any[] = [];
                              let detailStudio = item.studio || 'Unknown';
                              let detailRating = 0;
                              let detailSynopsis = item.synopsis || item.sinopsis || '';
                              let detailGenres = item.genres || item.genre || [];

                              try {
                                const detailRes = await fetch(`${getApiUrl(API_CONFIG.endpoints.detail)}/${slug}`);
                                const detailData = await detailRes.json();

                                console.log('[Admin] Detail API response:', detailData);

                                // DramaBos format: { code: 0, data: { episodes: [...], studio, rating, ... } }
                                const detail = detailData.data || {};
                                const episodes = detail.episodes || [];
                                console.log('[Admin] Episodes from detail:', episodes);

                                episodeData = episodes.map((ep: any, idx: number) => ({
                                  episodeNumber: parseInt(ep.ep) || idx + 1,
                                  slug: ep.slug || '',
                                  title: ep.title || `Episode ${ep.ep || idx + 1}`,
                                  releaseDate: ep.date || '',
                                }));

                                // Extract additional metadata from detail
                                if (detail.studio) detailStudio = detail.studio;
                                if (detail.rating) {
                                  // Rating might be "Rating 8.78" format
                                  const ratingMatch = detail.rating.match(/[\d.]+/);
                                  detailRating = ratingMatch ? parseFloat(ratingMatch[0]) : 0;
                                }
                                if (detail.synopsis) detailSynopsis = detail.synopsis;
                                if (detail.genres && Array.isArray(detail.genres)) detailGenres = detail.genres;

                                console.log('[Admin] Extracted episodeData:', episodeData);
                                console.log('[Admin] Studio:', detailStudio, 'Rating:', detailRating);
                              } catch (error) {
                                console.error('[Admin] Failed to fetch detail:', error);
                                // Continue without episode data
                              }

                              // Auto-translate synopsis to Indonesian
                              let translatedSynopsis = detailSynopsis;
                              console.log('[Admin] Original synopsis:', detailSynopsis?.substring(0, 100));

                              if (detailSynopsis && detailSynopsis.trim()) {
                                try {
                                  console.log('[Admin] Translating synopsis to Indonesian...');
                                  const translateRes = await fetch(`${BACKEND_URL}/api/anime/translate`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ text: detailSynopsis, targetLang: 'id' })
                                  });
                                  console.log('[Admin] Translate response status:', translateRes.status);
                                  const translateData = await translateRes.json();
                                  console.log('[Admin] Translate response:', translateData);
                                  if (translateData.translated) {
                                    translatedSynopsis = translateData.translated;
                                    console.log('[Admin] Synopsis translated successfully:', translatedSynopsis?.substring(0, 100));
                                  }
                                } catch (translateError) {
                                  console.error('[Admin] Translation failed, using original:', translateError);
                                }
                              } else {
                                console.log('[Admin] No synopsis to translate');
                              }

                              setFormData(prev => ({
                                ...prev,
                                id: slug, // ← FIX: Use slug as ID!
                                title: item.title || item.judul || 'Unknown',
                                poster: item.img || item.cover || '',
                                studio: detailStudio,
                                releasedYear: year,
                                episodes: item.total_episode || episodeData.length || 0,
                                status: status,
                                synopsis: translatedSynopsis,
                                genres: detailGenres,
                                rating: detailRating || rating,
                                episodeData: episodeData,
                              }));
                              setApiSearchResults([]); // Clear results after selection
                            }}
                          >
                            <img
                              src={item.img || item.cover}
                              alt={item.title || item.judul}
                              className="w-8 h-10 object-cover rounded"
                              loading="lazy"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-white">{item.title || item.judul}</div>
                              <div className="text-xs text-white/50">{item.studio || 'Unknown'} • {item.rating || item.score || 'N/A'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="col-span-2">
                      <label className="text-white/70 text-sm">Judul Anime</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Studio</label>
                      <input
                        type="text"
                        value={formData.studio}
                        onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Tahun Rilis</label>
                      <input
                        type="number"
                        value={formData.releasedYear}
                        onChange={(e) => setFormData({ ...formData, releasedYear: parseInt(e.target.value) })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Total Episode</label>
                      <input
                        type="number"
                        value={formData.episodes}
                        onChange={(e) => setFormData({ ...formData, episodes: parseInt(e.target.value) })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        max="10"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Ongoing' | 'Completed' })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="Ongoing" className="bg-[#1A1A2E]">Ongoing</option>
                        <option value="Completed" className="bg-[#1A1A2E]">Completed</option>
                      </select>
                    </div>
                    {/* Jadwal Rilis - Only show for Ongoing */}
                    {formData.status === 'Ongoing' && (
                      <>
                        <div>
                          <label className="text-white/70 text-sm">Hari Rilis</label>
                          <select
                            value={formData.jadwalRilis?.hari || ''}
                            onChange={(e) => setFormData({ ...formData, jadwalRilis: { ...formData.jadwalRilis, hari: e.target.value } })}
                            className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                          >
                            <option value="" className="bg-[#1A1A2E]">Tidak ada jadwal</option>
                            <option value="Senin" className="bg-[#1A1A2E]">Senin</option>
                            <option value="Selasa" className="bg-[#1A1A2E]">Selasa</option>
                            <option value="Rabu" className="bg-[#1A1A2E]">Rabu</option>
                            <option value="Kamis" className="bg-[#1A1A2E]">Kamis</option>
                            <option value="Jumat" className="bg-[#1A1A2E]">Jumat</option>
                            <option value="Sabtu" className="bg-[#1A1A2E]">Sabtu</option>
                            <option value="Minggu" className="bg-[#1A1A2E]">Minggu</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-white/70 text-sm">Jam Rilis (WIB)</label>
                          <input
                            type="time"
                            value={formData.jadwalRilis?.jam || ''}
                            onChange={(e) => setFormData({ ...formData, jadwalRilis: { ...formData.jadwalRilis, jam: e.target.value } })}
                            className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-white/70 text-sm">Tipe</label>
                      <select
                        value={formData.type || 'TV'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music' })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="TV" className="bg-[#1A1A2E]">TV Series</option>
                        <option value="Movie" className="bg-[#1A1A2E]">Movie</option>
                        <option value="OVA" className="bg-[#1A1A2E]">OVA</option>
                        <option value="ONA" className="bg-[#1A1A2E]">ONA</option>
                        <option value="Special" className="bg-[#1A1A2E]">Special</option>
                        <option value="Music" className="bg-[#1A1A2E]">Music</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">MAL ID (Optional)</label>
                      <input
                        type="number"
                        value={formData.malId || ''}
                        onChange={(e) => setFormData({ ...formData, malId: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="MyAnimeList ID"
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none placeholder-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">TMDB ID (Optional)</label>
                      <input
                        type="number"
                        value={formData.tmdbId || ''}
                        onChange={(e) => setFormData({ ...formData, tmdbId: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="TheMovieDB ID"
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none placeholder-white/30"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-white/70 text-sm">Sinopsis</label>
                      <textarea
                        rows={3}
                        value={formData.synopsis}
                        onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">URL Trailer (YouTube/Direct)</label>
                      <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=... atau URL video langsung"
                        value={formData.trailer}
                        onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none placeholder-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Tipe Trailer</label>
                      <select
                        value={formData.trailerType}
                        onChange={(e) => setFormData({ ...formData, trailerType: e.target.value as 'youtube' | 'direct' })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="youtube" className="bg-[#1A1A2E]">YouTube</option>
                        <option value="direct" className="bg-[#1A1A2E]">Direct Video (MP4)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleAddAnime} className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0]">Simpan Anime</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Anime Dialog */}
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-33rem max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Edit Anime</DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="col-span-2">
                      <label className="text-white/70 text-sm">Judul Anime</label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Studio</label>
                      <input
                        type="text"
                        value={editFormData.studio}
                        onChange={(e) => setEditFormData({ ...editFormData, studio: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Tahun Rilis</label>
                      <input
                        type="number"
                        value={editFormData.releasedYear}
                        onChange={(e) => setEditFormData({ ...editFormData, releasedYear: parseInt(e.target.value) })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Total Episode</label>
                      <input
                        type="number"
                        value={editFormData.episodes}
                        onChange={(e) => setEditFormData({ ...editFormData, episodes: parseInt(e.target.value) })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        max="10"
                        value={editFormData.rating}
                        onChange={(e) => setEditFormData({ ...editFormData, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'Ongoing' | 'Completed' })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="Ongoing" className="bg-[#1A1A2E]">Ongoing</option>
                        <option value="Completed" className="bg-[#1A1A2E]">Completed</option>
                      </select>
                    </div>
                    {/* Jadwal Rilis - Only show for Ongoing */}
                    {editFormData.status === 'Ongoing' && (
                      <>
                        <div>
                          <label className="text-white/70 text-sm">Hari Rilis</label>
                          <select
                            value={editFormData.jadwalRilis?.hari || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, jadwalRilis: { ...editFormData.jadwalRilis, hari: e.target.value } })}
                            className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                          >
                            <option value="" className="bg-[#1A1A2E]">Tidak ada jadwal</option>
                            <option value="Senin" className="bg-[#1A1A2E]">Senin</option>
                            <option value="Selasa" className="bg-[#1A1A2E]">Selasa</option>
                            <option value="Rabu" className="bg-[#1A1A2E]">Rabu</option>
                            <option value="Kamis" className="bg-[#1A1A2E]">Kamis</option>
                            <option value="Jumat" className="bg-[#1A1A2E]">Jumat</option>
                            <option value="Sabtu" className="bg-[#1A1A2E]">Sabtu</option>
                            <option value="Minggu" className="bg-[#1A1A2E]">Minggu</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-white/70 text-sm">Jam Rilis (WIB)</label>
                          <input
                            type="time"
                            value={editFormData.jadwalRilis?.jam || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, jadwalRilis: { ...editFormData.jadwalRilis, jam: e.target.value } })}
                            className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-white/70 text-sm">Tipe</label>
                      <select
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music' })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="TV" className="bg-[#1A1A2E]">TV Series</option>
                        <option value="Movie" className="bg-[#1A1A2E]">Movie</option>
                        <option value="OVA" className="bg-[#1A1A2E]">OVA</option>
                        <option value="ONA" className="bg-[#1A1A2E]">ONA</option>
                        <option value="Special" className="bg-[#1A1A2E]">Special</option>
                        <option value="Music" className="bg-[#1A1A2E]">Music</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-white/70 text-sm">URL Poster</label>
                      <input
                        type="text"
                        value={editFormData.poster}
                        onChange={(e) => setEditFormData({ ...editFormData, poster: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-white/70 text-sm">Sinopsis</label>
                      <textarea
                        rows={3}
                        value={editFormData.synopsis}
                        onChange={(e) => setEditFormData({ ...editFormData, synopsis: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">URL Trailer (YouTube/Direct)</label>
                      <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=... atau URL video langsung"
                        value={editFormData.trailer}
                        onChange={(e) => setEditFormData({ ...editFormData, trailer: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm">Tipe Trailer</label>
                      <select
                        value={editFormData.trailerType}
                        onChange={(e) => setEditFormData({ ...editFormData, trailerType: e.target.value as 'youtube' | 'direct' })}
                        className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="youtube" className="bg-[#1A1A2E]">YouTube</option>
                        <option value="direct" className="bg-[#1A1A2E]">Direct Video (MP4)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleUpdateAnime} className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0]">Update Anime</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Anime Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAnime.map((anime) => {
                const episodeDataCount = anime.episodeData?.length || 0;
                const totalEpisodes = anime.episodes || 0;

                return (
                  <motion.div
                    key={anime.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden group hover:border-[#6C5DD3]/30 transition-all hover:shadow-lg hover:shadow-[#6C5DD3]/10"
                  >
                    {/* Poster Section */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-transparent to-transparent" />

                      {/* Status Badge */}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-lg ${anime.status === 'Ongoing'
                        ? 'bg-green-500/90 text-white'
                        : 'bg-blue-500/90 text-white'
                        }`}>
                        {anime.status}
                      </span>

                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-medium">{anime.rating}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditAnime(anime)}
                          className="p-2 bg-[#6C5DD3] hover:bg-[#5a4ec0] rounded-lg text-white transition-colors"
                          title="Edit Anime"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAnimeForEpisodes(anime);
                            setActiveTab('episodes');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                          title="Kelola Episode"
                        >
                          <PlaySquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAnime(anime.id)}
                          className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                          title="Hapus Anime"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">{anime.title}</h3>
                      <p className="text-white/40 text-xs mb-3">{anime.studio}</p>

                      {/* Episode Stats */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                          <Film className="w-4 h-4 text-[#6C5DD3]" />
                          <div className="text-xs">
                            <span className="text-white font-medium">{totalEpisodes}</span>
                            <span className="text-white/40"> episode</span>
                          </div>
                        </div>
                        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg ${episodeDataCount > 0 ? 'bg-green-500/10' : 'bg-white/5'
                          }`}>
                          <Download className="w-4 h-4 text-green-400" />
                          <div className="text-xs">
                            <span className={`font-medium ${episodeDataCount > 0 ? 'text-green-400' : 'text-white/40'}`}>
                              {episodeDataCount}
                            </span>
                            <span className="text-white/40"> scraped</span>
                          </div>
                        </div>
                      </div>

                      {/* Views */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{(anime.views || 0).toLocaleString()} views</span>
                        </div>
                        <span className="text-white/30">{anime.releasedYear}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredAnime.length === 0 && (
              <div className="text-center py-20 bg-[#1A1A2E] rounded-2xl border border-white/5">
                <Film className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-semibold text-white mb-2">Tidak ada anime ditemukan</h3>
                <p className="text-white/50">Coba ubah kata kunci pencarian</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Schedule Management */}
        {activeTab === 'kelola-jadwal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminSchedule
              animeList={animeList}
              updateAnime={updateAnime}
              showToast={showToast}
            />
          </motion.div>
        )}

        {/* Add Anime Interaction Tab (Jikan Integration) */}
        {activeTab === 'add-anime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Note: TMDB Auto-import disabled (requires API key). Use Jikan API below instead. */}

            <h2 className="text-xl font-bold text-white mb-6">Tambah Anime Baru (via Jikan API)</h2>

            <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Cari judul anime di MyAnimeList (Jikan)..."
                  className="w-full pl-12 pr-4 py-4 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] text-lg"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const query = e.currentTarget.value;
                      if (!query) return;
                      try {
                        setApiSearchResults([]);
                        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`);
                        const data = await res.json();
                        setApiSearchResults(data.data || []);
                      } catch (err) {
                        console.error('Jikan Error:', err);
                      }
                    }
                  }}
                />
              </div>
              <Button className="h-full py-4 px-8 bg-[#6C5DD3] hover:bg-[#5a4ec0]">Cari</Button>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {apiSearchResults.map((anime: any, index: number) => (
                <div key={`${anime.mal_id}-${index}`} className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden hover:border-[#6C5DD3] transition-colors group relative">
                  <div className="aspect-[2/3] relative">
                    <img
                      src={anime.images?.jpg?.large_image_url}
                      alt={anime.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <Button
                        onClick={async () => {
                          // Generate readable ID (slug)
                          const slug = anime.title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '');
                          const customId = `${slug}-${anime.mal_id}`;

                          // Fetch TMDB ID from Jikan external links
                          let tmdbId: number | undefined;
                          try {
                            const extRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/external`);
                            const extData = await extRes.json();
                            const tmdbLink = extData.data?.find((link: any) => link.name === 'TheMovieDB');
                            if (tmdbLink?.url) {
                              // Extract TMDB ID from URL like: https://themoviedb.org/tv/12345
                              const match = tmdbLink.url.match(/\/tv\/(\d+)/);
                              if (match) tmdbId = parseInt(match[1]);
                            }
                          } catch (e) {
                            console.warn('Failed to fetch TMDB ID:', e);
                          }

                          // Map Jikan type to our type enum
                          const typeMapping: Record<string, 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music'> = {
                            'TV': 'TV',
                            'Movie': 'Movie',
                            'OVA': 'OVA',
                            'ONA': 'ONA',
                            'Special': 'Special',
                            'Music': 'Music',
                          };
                          const animeType = typeMapping[anime.type] || 'TV';

                          // Auto-translate synopsis to Indonesian
                          let translatedSynopsis = anime.synopsis || '';
                          if (anime.synopsis && anime.synopsis.trim()) {
                            try {
                              console.log('[Admin/Jikan] Translating synopsis to Indonesian...');
                              const translateRes = await fetch(`${BACKEND_URL}/api/anime/translate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: anime.synopsis, targetLang: 'id' })
                              });
                              const translateData = await translateRes.json();
                              if (translateData.translated) {
                                translatedSynopsis = translateData.translated;
                                console.log('[Admin/Jikan] Synopsis translated successfully');
                              }
                            } catch (translateError) {
                              console.error('[Admin/Jikan] Translation failed:', translateError);
                            }
                          }

                          const newAnime = {
                            id: customId,
                            title: anime.title,
                            studio: anime.studios?.[0]?.name || 'Unknown',
                            releasedYear: anime.year || new Date(anime.aired?.from).getFullYear() || 0,
                            episodes: anime.episodes || 0,
                            rating: anime.score || 0,
                            status: (anime.status === 'Finished Airing' ? 'Completed' : 'Ongoing') as 'Ongoing' | 'Completed',
                            type: animeType,
                            synopsis: translatedSynopsis,
                            poster: anime.images?.jpg?.large_image_url,
                            genres: anime.genres?.map((g: any) => g.name) || [],
                            malId: anime.mal_id, // Save MAL ID for Smashy Stream
                            tmdbId, // Save TMDB ID for Smashy Stream /tv endpoint
                          };
                          // Call Add Anime
                          addAnime(newAnime);
                          // Feedback with modern toast
                          showToast(`Berhasil menambahkan: ${anime.title}${tmdbId ? ` (TMDB: ${tmdbId})` : ''}`, 'success');
                        }}
                        className="w-full bg-[#6C5DD3]"
                      >
                        + Tambahkan
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium line-clamp-1" title={anime.title}>{anime.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                      <span>{anime.type || 'TV'}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-current" /> {anime.score || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {apiSearchResults.length === 0 && (
              <div className="text-center py-20 text-white/30">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Ketik judul anime dan tekan Enter untuk mencari</p>
              </div>
            )}

          </motion.div>
        )}

        {/* Manage Episodes Content */}
        {activeTab === 'episodes' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Show anime grid when no anime selected */}
            {!selectedAnimeForEpisodes ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Kelola Episode</h2>
                    <p className="text-white/50 text-sm mt-1">Pilih anime untuk mengelola episode</p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>

                {/* Anime Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredAnime.map((anime, idx) => {
                    const episodeDataCount = anime.episodeData?.length || 0;
                    const totalEpisodes = anime.episodes || 0;

                    return (
                      <motion.div
                        key={anime.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelectedAnimeForEpisodes(anime)}
                        className="bg-[#1A1A2E] border border-white/5 rounded-xl overflow-hidden cursor-pointer group hover:border-[#6C5DD3]/50 transition-all hover:scale-105"
                      >
                        {/* Poster */}
                        <div className="relative aspect-[2/3]">
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          {/* Episode Count Badge */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium ${episodeDataCount > 0
                              ? 'bg-green-500/90 text-white'
                              : 'bg-black/60 backdrop-blur-sm text-white/80'
                              }`}>
                              <PlaySquare className="w-3.5 h-3.5" />
                              <span>{episodeDataCount}/{totalEpisodes} Episode</span>
                            </div>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-[#6C5DD3]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-center text-white">
                              <Settings className="w-8 h-8 mx-auto mb-2" />
                              <span className="text-sm font-medium">Kelola Episode</span>
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="p-3">
                          <h3 className="text-white text-sm font-medium line-clamp-2">{anime.title}</h3>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {filteredAnime.length === 0 && (
                  <div className="text-center py-20 bg-[#1A1A2E] rounded-2xl border border-white/5">
                    <Film className="w-16 h-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold text-white mb-2">Tidak ada anime ditemukan</h3>
                    <p className="text-white/50">Coba ubah kata kunci pencarian</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Episode Management for Selected Anime */}
                <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden">
                  {/* Header with Anime Info */}
                  <div className="flex items-start gap-4 p-6 border-b border-white/5">
                    <img
                      src={selectedAnimeForEpisodes.poster}
                      alt={selectedAnimeForEpisodes.title}
                      className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-white line-clamp-1">{selectedAnimeForEpisodes.title}</h2>
                          <p className="text-white/50 text-sm mt-1">{selectedAnimeForEpisodes.studio} • {selectedAnimeForEpisodes.releasedYear}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-lg ${selectedAnimeForEpisodes.status === 'Ongoing'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                              }`}>
                              {selectedAnimeForEpisodes.status}
                            </span>
                            <span className="text-white/40 text-sm">
                              {selectedAnimeForEpisodes.episodeData?.length || 0}/{selectedAnimeForEpisodes.episodes || 0} Episode Scraped
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setSelectedAnimeForEpisodes(null)}
                          variant="ghost"
                          className="text-white/50 hover:text-white hover:bg-white/10"
                        >
                          ← Kembali
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Auto Scrape Button */}
                      <Button
                        onClick={() => {
                          setScrapeUrl(''); // Clear URL for auto-search
                          handleScrapeEpisodes();
                        }}
                        disabled={isScraping}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {isScraping ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
                        ) : (
                          <><Download className="w-4 h-4 mr-2" /> Scrape Otomatis</>
                        )}
                      </Button>

                      {/* Manual Episode Button */}
                      <Button onClick={createNewEpisode} className="bg-[#6C5DD3] hover:bg-[#5a4ec0]">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Episode Manual
                      </Button>
                    </div>

                    {/* Manual URL Scrape Section */}
                    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <label className="text-white/70 text-sm mb-2 block">Atau scrape dari URL spesifik:</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          placeholder="https://nontonanimeid.boats/anime/... atau https://otakudesu.cloud/anime/..."
                          className="flex-1 px-4 py-2.5 bg-[#0F0F1A] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] text-sm"
                        />
                        <Button
                          onClick={handleScrapeEpisodes}
                          disabled={isScraping || !scrapeUrl}
                          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                          <Download className="w-4 h-4 mr-2" /> Scrape URL
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle Generation Section */}
                  <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <span className="text-lg">🎬</span> AI Subtitle Generation
                    </h4>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-white/50 text-xs block mb-1">Provider</label>
                        <select
                          value={subtitleProvider}
                          onChange={(e) => setSubtitleProvider(e.target.value as 'openai' | 'local')}
                          className="px-3 py-2 bg-[#0F0F1A] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
                        >
                          <option value="openai">OpenAI Whisper API (~$0.006/menit)</option>
                          <option value="local">Local Whisper (Gratis, lebih lambat)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-white/50 text-xs block mb-1">Bahasa</label>
                        <select
                          value={subtitleLanguage || 'auto'}
                          onChange={(e) => setSubtitleLanguage(e.target.value === 'auto' ? null : e.target.value)}
                          className="px-3 py-2 bg-[#0F0F1A] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
                        >
                          <option value="auto">Auto Detect</option>
                          <option value="ja">Jepang (Original)</option>
                          <option value="id">Indonesia (Translate)</option>
                          <option value="en">English (Translate)</option>
                        </select>
                      </div>
                      <p className="text-white/40 text-xs">
                        Klik tombol 🎬 pada episode untuk generate subtitle otomatis
                      </p>

                      {/* Progress Indicator */}
                      {isGeneratingSubtitle && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-[#6C5DD3]/20 to-blue-600/20 rounded-xl border border-[#6C5DD3]/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#6C5DD3]/30 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-[#6C5DD3] animate-spin" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">
                                Episode {generatingEpisode} - Generating Subtitle
                              </div>
                              <div className="text-xs text-[#00C2FF] mt-0.5">
                                {subtitleProgress || 'Mempersiapkan...'}
                              </div>
                              <div className="text-[10px] text-white/40 mt-1">
                                ⏱️ Model large-v3: ~30-60 menit untuk video 24 menit (CPU)
                              </div>
                            </div>
                          </div>
                          {/* Animated Progress Bar */}
                          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] rounded-full animate-pulse" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Episode Cards Grid */}
                  <div className="p-6">
                    <h3 className="text-white font-semibold mb-4">Daftar Episode ({selectedAnimeForEpisodes.episodeData?.length || 0})</h3>

                    {selectedAnimeForEpisodes.episodeData && selectedAnimeForEpisodes.episodeData.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {[...selectedAnimeForEpisodes.episodeData]
                          .sort((a: any, b: any) => a.ep - b.ep)
                          .map((ep: any, idx: number) => {
                            const hasDirectStream = ep.streams?.some((s: any) => s.type === 'direct');
                            const hasSubtitle = !!ep.subtitle?.url;

                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.01 }}
                                className={`relative group p-3 rounded-lg border text-center transition-all ${ep.streams?.length > 0
                                  ? 'bg-green-500/10 border-green-500/30 hover:border-green-500'
                                  : 'bg-white/5 border-white/10 hover:border-white/30'
                                  }`}
                              >
                                {/* Episode Number */}
                                <div className={`text-xl font-bold ${ep.streams?.length > 0 ? 'text-green-400' : 'text-white/60'}`}>
                                  {ep.ep}
                                </div>

                                {/* Stream Count */}
                                <div className={`text-[10px] mt-1 ${ep.streams?.length > 0 ? 'text-green-400/70' : 'text-white/30'}`}>
                                  {ep.streams?.length || 0} stream
                                </div>

                                {/* Subtitle Status Badge */}
                                {hasSubtitle && (
                                  <div className="absolute top-1 right-1 px-1 py-0.5 bg-blue-500/90 text-white text-[8px] rounded font-medium">
                                    CC
                                  </div>
                                )}

                                {/* Action Buttons on Hover */}
                                <div className="absolute inset-0 bg-black/80 rounded-lg flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEpisodeEdit(ep); }}
                                    className="p-1.5 bg-[#6C5DD3] hover:bg-[#5a4ec0] rounded text-white transition-colors"
                                    title="Edit Episode"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {hasDirectStream && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateSubtitle(ep.ep);
                                      }}
                                      disabled={isGeneratingSubtitle}
                                      className={`p-1.5 rounded text-white transition-all ${isGeneratingSubtitle && generatingEpisode === ep.ep
                                        ? 'bg-gradient-to-r from-[#6C5DD3] to-blue-600 animate-pulse shadow-lg shadow-[#6C5DD3]/50'
                                        : hasSubtitle
                                          ? 'bg-blue-600 hover:bg-blue-700'
                                          : 'bg-orange-600 hover:bg-orange-700'
                                        } ${isGeneratingSubtitle && generatingEpisode !== ep.ep ? 'opacity-30' : ''}`}
                                      title={
                                        isGeneratingSubtitle && generatingEpisode === ep.ep
                                          ? `⏳ ${subtitleProgress || 'Processing...'}`
                                          : hasSubtitle ? 'Regenerate Subtitle' : 'Generate Subtitle'
                                      }
                                    >
                                      {isGeneratingSubtitle && generatingEpisode === ep.ep ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <span className="text-xs">{hasSubtitle ? '🔄' : '🎬'}</span>
                                      )}
                                    </button>
                                  )}

                                  {/* Delete Subtitle Button */}
                                  {hasSubtitle && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSubtitle(ep.ep);
                                      }}
                                      disabled={isGeneratingSubtitle}
                                      className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors disabled:opacity-30"
                                      title="Hapus Subtitle"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        }
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                        <PlaySquare className="w-12 h-12 mx-auto mb-3 text-white/20" />
                        <h3 className="text-white font-medium mb-1">Belum ada episode</h3>
                        <p className="text-white/40 text-sm">Klik "Scrape Otomatis" atau tambah episode manual</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Batch Upload Section */}
                <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl overflow-hidden mt-6">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CloudUpload className="w-5 h-5 text-[#6C5DD3]" />
                      Batch Upload Episode
                    </h3>
                    <p className="text-white/40 text-sm mt-1">Upload banyak episode sekaligus ke R2 Cloud</p>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Quality Selection */}
                    <div className="flex items-center gap-4">
                      <label className="text-white/70 text-sm">Kualitas untuk semua file:</label>
                      <select
                        value={batchQuality}
                        onChange={(e) => setBatchQuality(e.target.value)}
                        disabled={isBatchUploading}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[#6C5DD3] outline-none"
                      >
                        <option value="480p">480p</option>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                      </select>
                    </div>

                    {/* Drop Zone */}
                    {batchFiles.length === 0 ? (
                      <div className="relative border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#6C5DD3]/50 transition-colors">
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => handleBatchFileSelect(e.target.files)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-12 h-12 mx-auto mb-4 text-white/30" />
                        <p className="text-white/70 font-medium">Drop file video di sini atau klik untuk memilih</p>
                        <p className="text-white/40 text-sm mt-1">Support multiple files (MP4, MKV, dll)</p>
                      </div>
                    ) : (
                      <>
                        {/* File List */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {batchFiles.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-3 rounded-xl border ${item.status === 'complete' ? 'bg-green-500/10 border-green-500/30' :
                                item.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                  item.status === 'uploading' ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/30' :
                                    'bg-white/5 border-white/10'
                                }`}
                            >
                              {/* Episode Number Input */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-white/50 text-xs">Ep</span>
                                <input
                                  type="number"
                                  value={item.episodeNumber}
                                  onChange={(e) => updateBatchEpisodeNumber(idx, parseInt(e.target.value) || 1)}
                                  disabled={isBatchUploading || item.status === 'complete'}
                                  className="w-14 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center text-sm focus:border-[#6C5DD3] outline-none"
                                />
                              </div>

                              {/* File Name */}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{item.file.name}</p>
                                <p className="text-white/40 text-xs">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                              </div>

                              {/* Status */}
                              <div className="flex-shrink-0 w-20">
                                {item.status === 'pending' && (
                                  <span className="text-white/50 text-xs">Menunggu</span>
                                )}
                                {item.status === 'uploading' && (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-[#6C5DD3] animate-spin" />
                                    <span className="text-[#6C5DD3] text-xs">{item.progress}%</span>
                                  </div>
                                )}
                                {item.status === 'complete' && (
                                  <span className="text-green-400 text-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Selesai
                                  </span>
                                )}
                                {item.status === 'error' && (
                                  <span className="text-red-400 text-xs">Error</span>
                                )}
                              </div>

                              {/* Remove Button */}
                              {!isBatchUploading && item.status !== 'complete' && (
                                <button
                                  onClick={() => removeBatchFile(idx)}
                                  className="text-white/30 hover:text-red-400 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Progress Summary */}
                        {isBatchUploading && (
                          <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-white/70">Progress Upload</span>
                              <span className="text-white">{batchFiles.filter(f => f.status === 'complete').length}/{batchFiles.length}</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#6C5DD3] to-[#8B7FD3] transition-all"
                                style={{ width: `${(batchFiles.filter(f => f.status === 'complete').length / batchFiles.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button
                            onClick={handleBatchUpload}
                            disabled={isBatchUploading || batchFiles.every(f => f.status === 'complete')}
                            className="flex-1 bg-[#6C5DD3] hover:bg-[#5a4ec0] disabled:opacity-50"
                          >
                            {isBatchUploading ? (
                              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Mengupload...</>
                            ) : (
                              <><Upload className="w-4 h-4 mr-2" /> Mulai Upload ({batchFiles.filter(f => f.status === 'pending').length} file)</>
                            )}
                          </Button>
                          <Button
                            onClick={clearBatchFiles}
                            disabled={isBatchUploading}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <X className="w-4 h-4 mr-2" /> Clear
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Edit Episode Modal */}
            <Dialog open={isEpisodeModalOpen} onOpenChange={setIsEpisodeModalOpen}>
              <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="text-white">Edit Episode {episodeToEdit?.ep}</DialogTitle>
                </DialogHeader>

                {episodeToEdit && (
                  <div className="space-y-6 mt-4 flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/70 text-sm">Nomor Episode</label>
                        <input type="number" value={episodeToEdit.ep} onChange={(e) => setEpisodeToEdit({ ...episodeToEdit, ep: parseInt(e.target.value) })} className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#6C5DD3]" />
                      </div>
                      <div>
                        <label className="text-white/70 text-sm">Judul Episode</label>
                        <input type="text" value={episodeToEdit.title} onChange={(e) => setEpisodeToEdit({ ...episodeToEdit, title: e.target.value })} className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#6C5DD3]" />
                      </div>
                    </div>

                    {/* Upload Video Section */}
                    <div className="border-t border-white/10 pt-4">
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <CloudUpload className="w-5 h-5 text-[#6C5DD3]" />
                        Upload Video ke Cloud
                      </h4>

                      <div className="bg-white/5 p-4 rounded-xl">
                        {/* File Input Row */}
                        <div className="mb-3">
                          <label className="text-xs text-white/50 mb-1 block">File Video</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className={`w-full px-4 py-3 rounded-xl border border-dashed flex items-center gap-3 ${uploadFile ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 bg-[#1A1A2E]'}`}>
                              {uploadFile ? (
                                <>
                                  <Film className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <span className="text-white text-sm truncate flex-1 min-w-0">{uploadFile.name}</span>
                                  <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="text-white/50 hover:text-white flex-shrink-0">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 text-white/40 flex-shrink-0" />
                                  <span className="text-white/40 text-sm">Pilih atau drop file video...</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quality & Upload Row */}
                        <div className="flex gap-3 items-end">
                          <div className="w-24 flex-shrink-0">
                            <label className="text-xs text-white/50 mb-1 block">Kualitas</label>
                            <select
                              value={uploadQuality}
                              onChange={(e) => setUploadQuality(e.target.value)}
                              className="w-full px-3 py-2.5 bg-[#1A1A2E] rounded-xl border border-white/10 text-white text-sm"
                            >
                              <option value="480p">480p</option>
                              <option value="720p">720p</option>
                              <option value="1080p">1080p</option>
                            </select>
                          </div>

                          {/* Upload Button */}
                          <Button
                            onClick={handleUploadVideo}
                            disabled={!uploadFile || isUploading}
                            className={`flex-1 ${!uploadFile || isUploading ? 'bg-white/10' : 'bg-[#6C5DD3] hover:bg-[#5a4ec0]'}`}
                          >
                            {isUploading ? (
                              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Mengupload...</>
                            ) : (
                              <><Upload className="w-4 h-4 mr-2" /> Upload ke Cloud</>
                            )}
                          </Button>
                        </div>

                        {/* Progress Bar */}
                        {isUploading && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-white/50 mb-1">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#6C5DD3] to-[#8B7FD3] transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <h4 className="text-white font-medium mb-4">Link Stream Manual</h4>

                      {/* Add Stream Form */}
                      <div className="bg-white/5 p-4 rounded-xl mb-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-3">
                          <label className="text-xs text-white/50 mb-1 block">Server Name</label>
                          <input type="text" placeholder="e.g. Google Drive" value={streamServer} onChange={(e) => setStreamServer(e.target.value)} className="w-full px-3 py-2 bg-[#1A1A2E] rounded border border-white/10 text-white text-sm" />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-xs text-white/50 mb-1 block">URL</label>
                          <input type="text" placeholder="https://..." value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} className="w-full px-3 py-2 bg-[#1A1A2E] rounded border border-white/10 text-white text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-white/50 mb-1 block">Quality</label>
                          <select value={streamQuality} onChange={(e) => setStreamQuality(e.target.value)} className="w-full px-3 py-2 bg-[#1A1A2E] rounded border border-white/10 text-white text-sm">
                            <option value="1080p">1080p</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                            <option value="360p">360p</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-white/50 mb-1 block">Type</label>
                          <select value={streamType} onChange={(e) => setStreamType(e.target.value)} className="w-full px-3 py-2 bg-[#1A1A2E] rounded border border-white/10 text-white text-sm">
                            <option value="embed">Embed</option>
                            <option value="direct">Direct (MP4/Video)</option>
                            <option value="hls">HLS (m3u8)</option>
                            <option value="download">Download Only</option>
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <Button onClick={handleAddStream} className="w-full bg-[#6C5DD3] p-0 h-[38px]"><Plus className="w-4 h-4" /></Button>
                        </div>
                      </div>

                      {/* Stream List */}
                      <div className="space-y-2">
                        {episodeToEdit.streams?.map((stream: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className="font-bold text-white shrink-0">{stream.server}</span>
                              <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">{stream.quality}</span>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs uppercase">{stream.type}</span>
                              <span className="text-white/40 truncate text-xs">{stream.url}</span>
                            </div>
                            <button onClick={() => handleDeleteStream(idx)} className="text-white/30 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        {(!episodeToEdit.streams || episodeToEdit.streams.length === 0) && (
                          <p className="text-center text-white/30 text-sm py-2">Belum ada link manual.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Footer */}
                {episodeToEdit && (
                  <div className="flex-shrink-0 pt-4 border-t border-white/10">
                    <Button onClick={handleSaveEpisode} className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0]">Simpan Perubahan</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

          </motion.div>
        )}

        {/* Users Tab - Placeholder */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white/30" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Segera Hadir</h2>
            <p className="text-white/50">Fitur ini sedang dalam pengembangan</p>
          </motion.div>
        )}

        {/* Settings Tab - Website & Sidebar Widget Management */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Pengaturan</h1>
              <p className="text-white/50">Kelola nama website, deskripsi, dan widget sidebar</p>
            </div>

            {/* Website Settings */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Pengaturan Website</h2>
                    <p className="text-sm text-white/50">Ubah nama dan deskripsi website</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Site Logo */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Logo Website
                  </label>
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3]/20 border border-[#6C5DD3]/50 rounded-lg cursor-pointer hover:bg-[#6C5DD3]/30 transition-colors w-fit">
                      <CloudUpload className="w-4 h-4 text-[#6C5DD3]" />
                      <span className="text-sm text-white">
                        {isUploadingLogo ? 'Mengupload...' : 'Upload Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-white/40 mt-1">Upload gambar logo (PNG, JPG, WEBP). Maks 2MB.</p>
                  </div>
                  
                  {logoUploadError && (
                    <p className="text-xs text-red-400 mb-2">{logoUploadError}</p>
                  )}
                  
                  {/* URL Input (fallback) */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-white/30 text-sm">URL:</span>
                    </div>
                    <input
                      type="text"
                      value={siteLogo}
                      onChange={(e) => setSiteLogo(e.target.value)}
                      className="w-full pl-14 pr-4 py-2 bg-[#0F0F1A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  {/* Preview */}
                  {siteLogo && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <span className="text-xs text-white/40">Preview:</span>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center overflow-hidden">
                        <img src={siteLogo} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => setSiteLogo('')}
                        className="ml-auto text-xs text-red-400 hover:text-red-300"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                {/* Site Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nama Website
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    placeholder="Nama website..."
                  />
                  <p className="text-xs text-white/40 mt-1">Nama akan muncul di header, footer, dan meta tag</p>
                </div>

                {/* Site Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Deskripsi Website
                  </label>
                  <textarea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors resize-none"
                    placeholder="Deskripsi singkat website..."
                  />
                  <p className="text-xs text-white/40 mt-1">Deskripsi untuk SEO dan meta tag</p>
                </div>

                {/* Site Email */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    value={siteEmail}
                    onChange={(e) => setSiteEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors"
                    placeholder="support@domain.com"
                  />
                  <p className="text-xs text-white/40 mt-1">Email yang ditampilkan di halaman kontak</p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsSavingSettings(true);
                      // Save to localStorage
                      localStorage.setItem('siteName', siteName);
                      localStorage.setItem('siteDescription', siteDescription);
                      localStorage.setItem('siteEmail', siteEmail);
                      localStorage.setItem('siteLogo', siteLogo);
                      
                      // Save to backend
                      apiFetch(`${BACKEND_URL}/api/settings/siteName`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ value: siteName })
                      }).catch(() => {});
                      
                      apiFetch(`${BACKEND_URL}/api/settings/siteDescription`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ value: siteDescription })
                      }).catch(() => {});
                      
                      apiFetch(`${BACKEND_URL}/api/settings/siteEmail`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ value: siteEmail })
                      }).catch(() => {});
                      
                      apiFetch(`${BACKEND_URL}/api/settings/siteLogo`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ value: siteLogo })
                      }).catch(() => {});
                      
                      setTimeout(() => {
                        setIsSavingSettings(false);
                        alert('Pengaturan berhasil disimpan!');
                      }, 500);
                    }}
                    disabled={isSavingSettings}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Widget Management */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Widget Sidebar</h2>
                    <p className="text-sm text-white/50">Aktifkan/nonaktifkan dan atur urutan widget</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {sidebarWidgets.map((widget, index) => {
                  // Icon mapping
                  const iconMap: Record<string, any> = {
                    random: Shuffle,
                    stats: BarChart3,
                    schedule: Calendar,
                    topRating: Star,
                    genres: Tag,
                  };
                  const WidgetIcon = iconMap[widget.id] || TrendingUp;

                  return (
                    <motion.div
                      key={widget.id}
                      layout
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${widget.enabled
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/[0.02] border border-white/5 opacity-60'
                        }`}
                    >
                      {/* Drag Handle */}
                      <div className="text-white/30">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Widget Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${widget.enabled ? 'bg-[#6C5DD3]/20' : 'bg-white/5'
                        }`}>
                        <WidgetIcon className={`w-5 h-5 ${widget.enabled ? 'text-[#6C5DD3]' : 'text-white/30'}`} />
                      </div>

                      {/* Widget Name */}
                      <div className="flex-1">
                        <h3 className={`font-medium ${widget.enabled ? 'text-white' : 'text-white/50'}`}>
                          {widget.name}
                        </h3>
                        <p className="text-xs text-white/40">
                          Urutan: {index + 1}
                        </p>
                      </div>

                      {/* Move Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveWidget(widget.id, 'up')}
                          disabled={index === 0}
                          className={`p-2 rounded-lg transition-colors ${index === 0
                            ? 'text-white/10 cursor-not-allowed'
                            : 'text-white/50 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveWidget(widget.id, 'down')}
                          disabled={index === sidebarWidgets.length - 1}
                          className={`p-2 rounded-lg transition-colors ${index === sidebarWidgets.length - 1
                            ? 'text-white/10 cursor-not-allowed'
                            : 'text-white/50 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleWidget(widget.id)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${widget.enabled ? 'bg-[#6C5DD3]' : 'bg-white/10'
                          }`}
                      >
                        <motion.div
                          layout
                          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md ${widget.enabled ? 'left-6' : 'left-1'
                            }`}
                        />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-500/10 border-t border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 Perubahan akan langsung diterapkan di halaman Home. Refresh Home untuk melihat perubahan.
                </p>
              </div>
            </div>

            {/* Home Sections Management */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Home Sections</h2>
                    <p className="text-sm text-white/50">Tampilkan atau sembunyikan section di halaman Home</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {homeSections.map((section) => {
                  const iconMap: Record<string, any> = {
                    trending: TrendingUp,
                    continue: PlaySquare,
                    ongoing: Film,
                    latest: Search,
                    explore: Shuffle,
                    completed: CheckCircle2,
                  };
                  const SectionIcon = iconMap[section.id] || TrendingUp;

                  return (
                    <motion.div
                      key={section.id}
                      layout
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${section.enabled
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/[0.02] border border-white/5 opacity-60'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.enabled ? 'bg-[#6C5DD3]/20' : 'bg-white/5'
                        }`}>
                        <SectionIcon className={`w-5 h-5 ${section.enabled ? 'text-[#6C5DD3]' : 'text-white/30'}`} />
                      </div>

                      <div className="flex-1">
                        <h3 className={`font-medium ${section.enabled ? 'text-white' : 'text-white/50'}`}>
                          {section.name}
                        </h3>
                        {section.description && (
                          <p className="text-xs text-white/40">{section.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => toggleHomeSection(section.id)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${section.enabled ? 'bg-[#6C5DD3]' : 'bg-white/10'
                          }`}
                      >
                        <motion.div
                          layout
                          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md ${section.enabled ? 'left-6' : 'left-1'
                            }`}
                        />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-4 bg-blue-500/10 border-t border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 Home akan mengikuti pengaturan ini secara otomatis.
                </p>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const defaults = [
                    { id: 'random', name: 'Tombol Anime Random', enabled: true, order: 0 },
                    { id: 'stats', name: 'Statistik User', enabled: true, order: 1 },
                    { id: 'schedule', name: 'Jadwal Rilis', enabled: true, order: 2 },
                    { id: 'topRating', name: 'Top Rating', enabled: true, order: 3 },
                    { id: 'genres', name: 'Genre Populer', enabled: true, order: 4 },
                  ];
                  saveSidebarWidgets(defaults);
                  showToast('Widget direset ke default!', 'success');
                }}
                variant="outline"
                className="border-white/10 text-white/70 hover:bg-white/5"
              >
                Reset ke Default
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generate Subtitle Tab */}
        {activeTab === 'generate-sub' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Captions className="w-5 h-5 text-[#6C5DD3]" />
                  AI Subtitle Generator
                </h2>
                <p className="text-white/50 text-sm mt-1">Generate subtitle otomatis menggunakan AI Speech-to-Text</p>
              </div>

              {/* Settings */}
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-white font-medium mb-4">Pengaturan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white/60 text-sm block mb-2">Provider</label>
                    <select
                      value={subtitleProvider}
                      onChange={(e) => setSubtitleProvider(e.target.value as 'openai' | 'local')}
                      className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6C5DD3]"
                    >
                      <option value="openai">OpenAI Whisper API (~$0.006/menit)</option>
                      <option value="local">Local Whisper (Gratis, lebih lambat)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm block mb-2">Bahasa Output</label>
                    <select
                      value={subtitleLanguage || 'auto'}
                      onChange={(e) => setSubtitleLanguage(e.target.value === 'auto' ? null : e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6C5DD3]"
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="ja">Jepang (Original)</option>
                      <option value="id">Indonesia (Translate)</option>
                      <option value="en">English (Translate)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm">
                      💡 Hanya episode dengan video direct yang bisa di-generate
                    </div>
                  </div>
                </div>
              </div>

              {/* Anime List */}
              <div className="p-6">
                <h3 className="text-white font-medium mb-4">Pilih Anime</h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>

                {/* Anime Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredAnime
                    .filter(anime => anime.episodeData?.some((ep: any) => ep.streams?.some((s: any) => s.type === 'direct')))
                    .map((anime, idx) => {
                      const episodesWithDirect = anime.episodeData?.filter((ep: any) =>
                        ep.streams?.some((s: any) => s.type === 'direct')
                      ).length || 0;
                      const episodesWithSub = anime.episodeData?.filter((ep: any) => ep.subtitle?.url).length || 0;

                      return (
                        <motion.div
                          key={anime.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-[#0F0F1A] border border-white/10 rounded-xl overflow-hidden hover:border-[#6C5DD3]/50 transition-all"
                        >
                          <div className="relative aspect-[2/3]">
                            <img
                              src={anime.poster}
                              alt={anime.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                            {/* Stats */}
                            <div className="absolute bottom-2 left-2 right-2 space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <span className="px-1.5 py-0.5 bg-green-500/80 text-white rounded">{episodesWithDirect} Direct</span>
                                <span className={`px-1.5 py-0.5 rounded ${episodesWithSub > 0 ? 'bg-blue-500/80' : 'bg-white/20'} text-white`}>
                                  {episodesWithSub} CC
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3">
                            <h4 className="text-white text-sm font-medium line-clamp-2 mb-2">{anime.title}</h4>
                            <Button
                              onClick={() => setSelectedAnimeForEpisodes(anime)}
                              size="sm"
                              className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0] text-xs"
                            >
                              <Captions className="w-3 h-3 mr-1" /> Generate Sub
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>

                {filteredAnime.filter(anime => anime.episodeData?.some((ep: any) => ep.streams?.some((s: any) => s.type === 'direct'))).length === 0 && (
                  <div className="text-center py-16 bg-white/5 rounded-xl border border-white/5">
                    <Captions className="w-12 h-12 mx-auto mb-3 text-white/20" />
                    <h3 className="text-white font-medium mb-1">Tidak ada anime dengan video direct</h3>
                    <p className="text-white/40 text-sm">Upload video episode terlebih dahulu di Kelola Episode</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Anime Episodes */}
            {selectedAnimeForEpisodes && (
              <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedAnimeForEpisodes.poster}
                      alt=""
                      className="w-16 h-20 object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div>
                      <h3 className="text-white font-bold">{selectedAnimeForEpisodes.title}</h3>
                      <p className="text-white/50 text-sm">{selectedAnimeForEpisodes.studio} • {selectedAnimeForEpisodes.releasedYear}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedAnimeForEpisodes(null)} className="text-white/50 hover:text-white">
                    ← Kembali
                  </Button>
                </div>

                <div className="p-6">
                  <h4 className="text-white font-medium mb-4">Episode dengan Video Direct</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {selectedAnimeForEpisodes.episodeData
                      ?.filter((ep: any) => ep.streams?.some((s: any) => s.type === 'direct'))
                      .sort((a: any, b: any) => a.ep - b.ep)
                      .map((ep: any) => {
                        const hasSubtitle = !!ep.subtitle?.url;

                        return (
                          <div
                            key={ep.ep}
                            className={`relative p-4 rounded-xl border text-center ${hasSubtitle
                              ? 'bg-blue-500/10 border-blue-500/30'
                              : 'bg-green-500/10 border-green-500/30'
                              }`}
                          >
                            <div className="text-2xl font-bold text-white mb-1">{ep.ep}</div>
                            <div className="text-xs text-white/50 mb-2">
                              {hasSubtitle ? 'CC Ready' : 'No Sub'}
                            </div>
                            <Button
                              onClick={() => handleGenerateSubtitle(ep.ep)}
                              disabled={isGeneratingSubtitle}
                              size="sm"
                              className={`w-full text-xs ${hasSubtitle
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                            >
                              {isGeneratingSubtitle && generatingEpisode === ep.ep ? (
                                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</>
                              ) : (
                                <>{hasSubtitle ? 'Regenerate' : 'Generate'}</>
                              )}
                            </Button>

                            {hasSubtitle && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Hero Management Tab */}
        {activeTab === 'hero' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Current Hero Anime */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#6C5DD3]" />
                  Anime di Hero Carousel
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  Pilih maksimal 5 anime untuk ditampilkan di Hero carousel. Jika kosong, akan otomatis menggunakan anime rating tertinggi.
                </p>
              </div>

              {/* Hero Anime List */}
              <div className="p-4 space-y-2">
                {heroAnimeIds.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada anime di Hero</p>
                    <p className="text-sm">Akan otomatis menggunakan anime dengan rating tertinggi</p>
                  </div>
                ) : (
                  heroAnimeIds.map((id, index) => {
                    const anime = animeList.find(a => a.id === id);
                    return (
                      <motion.div
                        key={id}
                        layout
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        {/* Order Number */}
                        <div className="w-8 h-8 rounded-lg bg-[#6C5DD3]/20 flex items-center justify-center">
                          <span className="text-[#6C5DD3] font-bold">{index + 1}</span>
                        </div>

                        {/* Thumbnail */}
                        {anime?.poster && (
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            className="w-12 h-16 object-cover rounded-lg"
                            loading="lazy"
                          />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{anime?.title || id}</p>
                          <p className="text-xs text-white/50 flex items-center gap-2">
                            {anime?.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {anime.rating.toFixed(1)}
                              </span>
                            )}
                            {anime?.status && <span>{anime.status}</span>}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveHeroAnime(id, 'up')}
                            disabled={index === 0}
                            className={`p-2 rounded-lg transition-colors ${index === 0
                              ? 'text-white/10 cursor-not-allowed'
                              : 'text-white/50 hover:text-white hover:bg-white/10'
                              }`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveHeroAnime(id, 'down')}
                            disabled={index === heroAnimeIds.length - 1}
                            className={`p-2 rounded-lg transition-colors ${index === heroAnimeIds.length - 1
                              ? 'text-white/10 cursor-not-allowed'
                              : 'text-white/50 hover:text-white hover:bg-white/10'
                              }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromHero(id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-500/10 border-t border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 Hero carousel akan menampilkan anime sesuai urutan di atas. Refresh halaman Home untuk melihat perubahan.
                </p>
              </div>
            </div>

            {/* Add Anime to Hero */}
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#12121F] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">Tambah Anime ke Hero</h2>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari anime..."
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]"
                  />
                </div>
              </div>

              {/* Anime Grid */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {animeList
                    .filter(anime =>
                      !heroAnimeIds.includes(anime.id) &&
                      anime.title.toLowerCase().includes(heroSearchQuery.toLowerCase())
                    )
                    .slice(0, 20)
                    .map(anime => (
                      <div
                        key={anime.id}
                        className="relative group cursor-pointer"
                        onClick={() => addToHero(anime.id)}
                      >
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="p-3 bg-[#6C5DD3] rounded-full">
                              <Plus className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-white truncate">{anime.title}</p>
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {anime.rating?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  saveHeroSettings([]);
                  showToast('Hero direset! Akan menggunakan anime rating tertinggi.', 'success');
                }}
                variant="outline"
                className="border-white/10 text-white/70 hover:bg-white/5"
              >
                Reset ke Default (Auto)
              </Button>
            </div>
          </motion.div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminUsers />
          </motion.div>
        )}

        {/* Badge Management */}
        {activeTab === 'badges' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminBadges />
          </motion.div>
        )}

        {/* Content Moderation */}
        {activeTab === 'moderation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AdminModeration />
          </motion.div>
        )}
      </main>
    </div >
  );
}
