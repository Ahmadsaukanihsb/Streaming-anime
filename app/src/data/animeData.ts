export interface EpisodeMetadata {
  episodeNumber: number;
  chapterUrlId: string; // URL ID for /anime/getvideo API
  title?: string;
  releaseDate?: string;
  ep?: number; // Backend uses 'ep' for custom uploads
  streams?: any[]; // Backend stores streams here
  thumbnail?: string; // Thumbnail URL from video
  manualStreams?: any[]; // Manual upload streams
}

export interface Anime {
  id: string;
  title: string;
  titleJp?: string;
  synopsis: string;
  poster: string;
  banner?: string;
  rating: number;
  status: 'Ongoing' | 'Completed';
  type?: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music';
  episodes: number;
  releasedYear: number;
  studio: string;
  genres: string[];
  duration?: string;
  views?: number;
  malId?: number; // MyAnimeList ID for Smashy Stream
  tmdbId?: number; // TMDB ID for Smashy Stream /tv endpoint
  jadwalRilis?: {
    hari: string;
    jam: string;
  };
  episodeData?: EpisodeMetadata[]; // Optional: episode metadata from API
}

export interface Episode {
  id: string;
  animeId: string;
  number: number;
  title: string;
  thumbnail: string;
  duration: string;
  releasedDate: string;
  views: number;
}

export const heroSlides = [
  {
    id: '1',
    title: 'Jujutsu Kaisen',
    titleJp: '呪術廻戦',
    description: 'Yuji Itadori menelan jari kutukan untuk menyelamatkan temannya, dan kini ia harus menjadi pembasmi kutukan untuk mengendalikan kekuatan mengerikan di dalam dirinya.',
    image: '/images/hero/hero-jujutsu.jpg',
    rating: 9.2,
    episodes: 24,
    status: 'Ongoing' as const,
    genres: ['Action', 'Supernatural', 'Dark Fantasy'],
  },
  {
    id: '2',
    title: 'Solo Leveling',
    titleJp: '俺だけレベルアップな件',
    description: 'Sung Jin-Woo, hunter terlemah, menemukan dirinya memiliki kemampuan unik untuk naik level. Dari yang terlemah menjadi yang terkuat!',
    image: '/images/anime/solo-leveling.jpg',
    rating: 9.5,
    episodes: 12,
    status: 'Ongoing' as const,
    genres: ['Action', 'Fantasy', 'Adventure'],
  },
  {
    id: '3',
    title: 'Demon Slayer',
    titleJp: '鬼滅の刃',
    description: 'Tanjiro Kamado berjuang untuk menyelamatkan adiknya Nezuko yang berubah menjadi setan, dan membalas dendam atas keluarganya yang dibantai.',
    image: '/images/anime/demon-slayer.jpg',
    rating: 9.3,
    episodes: 26,
    status: 'Completed' as const,
    genres: ['Action', 'Supernatural', 'Historical'],
  },
];

export const ongoingAnime: Anime[] = [
  {
    id: '1',
    title: 'Jujutsu Kaisen Season 2',
    titleJp: '呪術廻戦',
    synopsis: 'Melanjutkan petualangan Yuji Itadori dan teman-temannya di dunia sihir dan kutukan.',
    poster: '/images/anime/jujutsu-kaisen.jpg',
    banner: '/images/hero/hero-jujutsu.jpg',
    rating: 9.2,
    status: 'Ongoing',
    episodes: 24,
    releasedYear: 2023,
    studio: 'MAPPA',
    genres: ['Action', 'Supernatural', 'Dark Fantasy'],
    duration: '24 min',
    views: 12500000,
    malId: 51009,
    jadwalRilis: { hari: 'Kamis', jam: '23:56' },
  },
  {
    id: '2',
    title: 'Solo Leveling',
    titleJp: '俺だけレベルアップな件',
    synopsis: 'Hunter terlemah mendapatkan kekuatan untuk naik level tanpa batas.',
    poster: '/images/anime/solo-leveling.jpg',
    rating: 9.5,
    status: 'Ongoing',
    episodes: 12,
    releasedYear: 2024,
    studio: 'A-1 Pictures',
    genres: ['Action', 'Fantasy', 'Adventure'],
    duration: '23 min',
    views: 15000000,
    malId: 52299,
    jadwalRilis: { hari: 'Minggu', jam: '00:00' },
  },
  {
    id: '3',
    title: 'Demon Slayer',
    titleJp: '鬼滅の刃',
    synopsis: 'Pemburu setan muda berjuang untuk menyelamatkan adiknya dan membalas dendam.',
    poster: '/images/anime/demon-slayer.jpg',
    rating: 9.3,
    status: 'Completed',
    episodes: 26,
    releasedYear: 2019,
    studio: 'ufotable',
    genres: ['Action', 'Supernatural', 'Historical'],
    duration: '24 min',
    views: 20000000,
  },
  {
    id: '4',
    title: 'Naruto Shippuden',
    titleJp: 'ナルト疾風伝',
    synopsis: 'Naruto Uzumaki kembali ke Konoha setelah 3 tahun berlatih untuk menjadi Hokage.',
    poster: '/images/anime/naruto.jpg',
    rating: 8.9,
    status: 'Completed',
    episodes: 500,
    releasedYear: 2007,
    studio: 'Pierrot',
    genres: ['Action', 'Adventure', 'Ninja'],
    duration: '23 min',
    views: 35000000,
  },
  {
    id: '5',
    title: 'One Piece',
    titleJp: 'ワンピース',
    synopsis: 'Monkey D. Luffy dan kru bajak lautnya mencari harta karun legendaris One Piece.',
    poster: '/images/anime/one-piece.jpg',
    rating: 9.1,
    status: 'Ongoing',
    episodes: 1100,
    releasedYear: 1999,
    studio: 'Toei Animation',
    genres: ['Action', 'Adventure', 'Fantasy'],
    duration: '24 min',
    views: 45000000,
  },
  {
    id: '6',
    title: 'Attack on Titan',
    titleJp: '進撃の巨人',
    synopsis: 'Umat manusia berjuang melawan raksasa pemakan manusia yang mengancam keberadaan mereka.',
    poster: '/images/anime/attack-on-titan.jpg',
    rating: 9.4,
    status: 'Completed',
    episodes: 87,
    releasedYear: 2013,
    studio: 'Wit Studio / MAPPA',
    genres: ['Action', 'Dark Fantasy', 'Drama'],
    duration: '24 min',
    views: 28000000,
  },
  {
    id: '7',
    title: 'My Hero Academia',
    titleJp: '僕のヒーローアカデミア',
    synopsis: 'Izuku Midoriya berjuang menjadi pahlawan terhebat meski lahir tanpa kekuatan.',
    poster: '/images/anime/my-hero-academia.jpg',
    rating: 8.7,
    status: 'Ongoing',
    episodes: 138,
    releasedYear: 2016,
    studio: 'Bones',
    genres: ['Action', 'Superhero', 'School'],
    duration: '24 min',
    views: 22000000,
  },
  {
    id: '8',
    title: 'Fullmetal Alchemist: Brotherhood',
    titleJp: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    synopsis: 'Dua bersaudara mencari Batu Bertuah untuk memulihkan tubuh mereka.',
    poster: '/images/anime/fullmetal-alchemist.jpg',
    rating: 9.6,
    status: 'Completed',
    episodes: 64,
    releasedYear: 2009,
    studio: 'Bones',
    genres: ['Action', 'Adventure', 'Fantasy'],
    duration: '24 min',
    views: 18000000,
  },
];

export const latestEpisodes: Episode[] = [
  {
    id: 'e1',
    animeId: '1',
    number: 24,
    title: 'Keputusan Terakhir',
    thumbnail: '/images/episodes/episode-1.jpg',
    duration: '24:15',
    releasedDate: '2 jam yang lalu',
    views: 125000,
  },
  {
    id: 'e2',
    animeId: '2',
    number: 12,
    title: 'Raja Bangkit',
    thumbnail: '/images/episodes/episode-2.jpg',
    duration: '23:45',
    releasedDate: '5 jam yang lalu',
    views: 280000,
  },
  {
    id: 'e3',
    animeId: '3',
    number: 26,
    title: 'Perpisahan',
    thumbnail: '/images/episodes/episode-3.jpg',
    duration: '24:30',
    releasedDate: '1 hari yang lalu',
    views: 195000,
  },
  {
    id: 'e4',
    animeId: '4',
    number: 220,
    title: 'Latihan Baru',
    thumbnail: '/images/episodes/episode-4.jpg',
    duration: '23:20',
    releasedDate: '1 hari yang lalu',
    views: 89000,
  },
];

export const topRatedAnime: Anime[] = [
  {
    id: '8',
    title: 'Fullmetal Alchemist: Brotherhood',
    titleJp: '鋼の錬金術師',
    synopsis: 'Dua bersaudara mencari Batu Bertuah.',
    poster: '/images/anime/fullmetal-alchemist.jpg',
    rating: 9.6,
    status: 'Completed',
    episodes: 64,
    releasedYear: 2009,
    studio: 'Bones',
    genres: ['Action', 'Adventure'],
    views: 18000000,
  },
  {
    id: '2',
    title: 'Solo Leveling',
    titleJp: '俺だけレベルアップな件',
    synopsis: 'Hunter terlemah menjadi terkuat.',
    poster: '/images/anime/solo-leveling.jpg',
    rating: 9.5,
    status: 'Ongoing',
    episodes: 12,
    releasedYear: 2024,
    studio: 'A-1 Pictures',
    genres: ['Action', 'Fantasy'],
    views: 15000000,
  },
  {
    id: '6',
    title: 'Attack on Titan',
    titleJp: '進撃の巨人',
    synopsis: 'Manusia vs Raksasa.',
    poster: '/images/anime/attack-on-titan.jpg',
    rating: 9.4,
    status: 'Completed',
    episodes: 87,
    releasedYear: 2013,
    studio: 'MAPPA',
    genres: ['Action', 'Drama'],
    views: 28000000,
  },
  {
    id: '3',
    title: 'Demon Slayer',
    titleJp: '鬼滅の刃',
    synopsis: 'Pembasmi setan.',
    poster: '/images/anime/demon-slayer.jpg',
    rating: 9.3,
    status: 'Completed',
    episodes: 26,
    releasedYear: 2019,
    studio: 'ufotable',
    genres: ['Action', 'Supernatural'],
    views: 20000000,
  },
  {
    id: '9',
    title: 'Steins;Gate',
    titleJp: 'シュタインズ・ゲート',
    synopsis: 'Perjalanan waktu dan konsekuensinya.',
    poster: '/images/anime/steins-gate.jpg',
    rating: 9.3,
    status: 'Completed',
    episodes: 24,
    releasedYear: 2011,
    studio: 'White Fox',
    genres: ['Sci-Fi', 'Thriller'],
    views: 12000000,
  },
];

export const genres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Psychological',
];

export const studios = [
  'MAPPA', 'ufotable', 'Bones', 'A-1 Pictures', 'Wit Studio',
  'Toei Animation', 'Pierrot', 'White Fox', 'Kyoto Animation', 'Madhouse',
];

export const years = Array.from({ length: 25 }, (_, i) => 2024 - i);

export const getAnimeById = (id: string): Anime | undefined => {
  return ongoingAnime.find(anime => anime.id === id);
};

export const getEpisodesByAnimeId = (animeId: string): Episode[] => {
  return latestEpisodes.filter(ep => ep.animeId === animeId);
};

export const getRelatedAnime = (genres: string[], excludeId: string): Anime[] => {
  return ongoingAnime
    .filter(anime => anime.id !== excludeId && anime.genres.some(g => genres.includes(g)))
    .slice(0, 4);
};
