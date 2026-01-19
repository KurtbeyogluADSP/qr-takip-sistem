import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus } from 'lucide-react';

export default function CreateUserTab({ onUserCreated }: { onUserCreated?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [newUser, setNewUser] = useState({
        name: '',
        role: 'assistant' as 'assistant' | 'physician' | 'admin' | 'staff'
    });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('users')
                .insert({
                    name: newUser.name,
                    role: newUser.role,
                    is_locked_out: false
                });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Kullanıcı başarıyla oluşturuldu!' });
            setNewUser({ name: '', role: 'assistant' });
            if (onUserCreated) onUserCreated();
            if (onUserCreated) onUserCreated();
        } catch (err: unknown) {
            setMessage({ type: 'error', text: (err as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                    <UserPlus className="text-blue-600" />
                    Yeni Personel Kartı Oluştur
                </h2>

                <form onSubmit={handleCreateUser} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                        <input
                            required
                            type="text"
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                            placeholder="Örn: Ayşe Yılmaz"
                            value={newUser.name}
                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Görev / Rol</label>
                        <select
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value as 'assistant' | 'physician' | 'admin' | 'staff' })}
                        >
                            <option value="assistant">Asistan</option>
                            <option value="physician">Hekim</option>
                            <option value="staff">Personel</option>
                            <option value="admin">Yönetici</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            * Yönetici rolü tüm sistem ayarlarına erişebilir.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 mt-4 active:scale-95 transform"
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <UserPlus size={20} />}
                        Personeli Sisteme Ekle
                    </button>

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
