import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Shield, User, Pencil, Trash2, X, Check } from 'lucide-react';

type UserType = {
    id: string;
    name: string;
    role: 'admin' | 'assistant' | 'physician' | 'staff';
    is_locked_out: boolean;
    created_at: string;
};

export default function AdminUsers() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [newUser, setNewUser] = useState({
        name: '',
        role: 'assistant' as 'assistant' | 'physician' | 'admin' | 'staff'
    });

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setUsers(data);
    };

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
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = (user: UserType) => {
        setEditingId(user.id);
        setEditForm({ name: user.name, role: user.role });
    };

    const handleEditSave = async (id: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ name: editForm.name, role: editForm.role })
                .eq('id', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Kullanıcı güncellendi!' });
            setEditingId(null);
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditForm({ name: '', role: '' });
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Kullanıcı silindi!' });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700',
            physician: 'bg-teal-100 text-teal-700',
            assistant: 'bg-blue-100 text-blue-700',
            staff: 'bg-orange-100 text-orange-700'
        };
        const labels: Record<string, string> = {
            admin: 'Admin',
            physician: 'Hekim',
            assistant: 'Asistan',
            staff: 'Personel'
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
                {role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                {labels[role] || role}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                <UserPlus className="text-blue-600" />
                Kullanıcı Yönetimi
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-700">Yeni Kullanıcı Ekle</h2>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Ad Soyad</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Örn: Ayşe Yılmaz"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Rol</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                >
                                    <option value="assistant">Asistan</option>
                                    <option value="physician">Hekim</option>
                                    <option value="staff">Personel</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <UserPlus size={20} />}
                                Kullanıcı Oluştur
                            </button>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* User List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-700">Mevcut Kullanıcılar</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm">
                                    <tr>
                                        <th className="p-4 font-medium">Kullanıcı</th>
                                        <th className="p-4 font-medium">Rol</th>
                                        <th className="p-4 font-medium">Oluşturulma</th>
                                        <th className="p-4 font-medium text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                {editingId === user.id ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="p-2 border rounded-lg w-full"
                                                    />
                                                ) : (
                                                    <div className="font-medium text-slate-900">{user.name}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {editingId === user.id ? (
                                                    <select
                                                        value={editForm.role}
                                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                                        className="p-2 border rounded-lg"
                                                    >
                                                        <option value="assistant">Asistan</option>
                                                        <option value="physician">Hekim</option>
                                                        <option value="staff">Personel</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    getRoleBadge(user.role)
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-500 text-sm">
                                                {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="p-4 text-right">
                                                {editingId === user.id ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleEditSave(user.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Kaydet"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={handleEditCancel}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                            title="İptal"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleEditStart(user)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Düzenle"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id, user.name)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                Henüz kullanıcı bulunmuyor.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
