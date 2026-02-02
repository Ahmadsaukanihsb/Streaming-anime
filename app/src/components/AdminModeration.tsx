import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Loader2,
    Shield,
    AlertTriangle
} from 'lucide-react';
import { BACKEND_URL } from '@/config/api';

interface BannedWord {
    _id: string;
    word: string;
    createdAt: string;
}

export default function AdminModeration() {
    const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [newWord, setNewWord] = useState('');
    const [bulkWords, setBulkWords] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchBannedWords();
    }, []);

    const fetchBannedWords = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/api/admin/banned-words`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setBannedWords(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addWord = async () => {
        if (!newWord.trim()) return;

        try {
            setIsAdding(true);
            setError(null);
            const res = await fetch(`${BACKEND_URL}/api/admin/banned-words`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: newWord.trim() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setBannedWords(prev => [data.bannedWord, ...prev]);
            setNewWord('');
            setSuccess('Kata berhasil ditambahkan');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const addBulkWords = async () => {
        const words = bulkWords.split('\n').map(w => w.trim()).filter(w => w.length >= 2);
        if (words.length === 0) return;

        try {
            setIsAdding(true);
            setError(null);
            const res = await fetch(`${BACKEND_URL}/api/admin/banned-words/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            fetchBannedWords(); // Refresh list
            setBulkWords('');
            setSuccess(`${data.added.length} kata ditambahkan, ${data.skipped.length} dilewati (sudah ada)`);
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const deleteWord = async (id: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/banned-words/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            setBannedWords(prev => prev.filter(w => w._id !== id));
            setSuccess('Kata berhasil dihapus');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#6C5DD3]" />
                    Content Moderation
                </h3>
                <p className="text-white/50 text-sm">
                    Kelola kata-kata yang akan diblokir dari komentar. Komentar yang mengandung kata ini akan ditolak.
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400">
                    {success}
                </div>
            )}

            {/* Add Single Word */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Tambah Kata Banned</h4>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        placeholder="Masukkan kata..."
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                        onKeyDown={(e) => e.key === 'Enter' && addWord()}
                    />
                    <button
                        onClick={addWord}
                        disabled={isAdding || !newWord.trim()}
                        className="px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5a4eb8] disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Tambah
                    </button>
                </div>
            </div>

            {/* Bulk Add */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Tambah Banyak Kata (1 per baris)</h4>
                <textarea
                    value={bulkWords}
                    onChange={(e) => setBulkWords(e.target.value)}
                    placeholder="kata1&#10;kata2&#10;kata3"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] min-h-[100px]"
                />
                <button
                    onClick={addBulkWords}
                    disabled={isAdding || !bulkWords.trim()}
                    className="mt-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5a4eb8] disabled:opacity-50 flex items-center gap-2"
                >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Tambah Semua
                </button>
            </div>

            {/* Banned Words List */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">
                    Daftar Kata Banned ({bannedWords.length})
                </h4>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#6C5DD3] animate-spin" />
                    </div>
                ) : bannedWords.length === 0 ? (
                    <p className="text-center text-white/50 py-8">
                        Belum ada kata yang dibanned
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {bannedWords.map((word) => (
                            <div
                                key={word._id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
                            >
                                <span>{word.word}</span>
                                <button
                                    onClick={() => deleteWord(word._id)}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
