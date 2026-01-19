import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, User, Phone, MapPin, Calendar } from 'lucide-react';

type UserType = {
    id: string;
    name: string;
    role: 'admin' | 'assistant' | 'physician' | 'staff';
    created_at: string;
};

export default function UserListTab() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    type UserStats = {
        workDays: number;
        lastSeen: string | null;
    };
    const [stats, setStats] = useState<UserStats | null>(null); // For user specific stats

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setUsers(data as UserType[]);
    };

    const fetchUserStats = async (userId: string) => {
        // Fetch simple stats for the card
        const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(100);

        // Simple calc: total work days = unique dates
        const uniqueDays = new Set(attendance?.map((a: { timestamp: string }) => a.timestamp.split('T')[0])).size;

        setStats({
            workDays: uniqueDays,
            lastSeen: attendance?.[0]?.timestamp
        });
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchUserStats(selectedUser.id);
        }
    }, [selectedUser]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
        await supabase.from('users').delete().eq('id', id);
        fetchUsers();
        if (selectedUser?.id === id) setSelectedUser(null);
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Yönetici',
            physician: 'Hekim',
            assistant: 'Asistan',
            staff: 'Personel'
        };
        return labels[role] || role;
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* List */}
            <div className={`w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-700">Personel Listesi</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${selectedUser?.id === user.id
                                ? 'bg-blue-50 border-blue-200 border shadow-sm'
                                : 'hover:bg-slate-50 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedUser?.id === user.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900">{user.name}</h4>
                                    <span className="text-xs text-slate-500">{getRoleLabel(user.role)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card View */}
            <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:flex items-center justify-center overflow-y-auto relative ${selectedUser ? 'flex' : 'hidden'}`}>
                {selectedUser && (
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="md:hidden absolute top-4 left-4 p-2 bg-slate-100 rounded-full text-slate-600"
                    >
                        ← Listeye Dön
                    </button>
                )}

                {selectedUser ? (
                    <div className="w-full max-w-md pt-10 md:pt-0">
                        {/* ID Card Template Design */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white relative">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full translate-y-16 -translate-x-16 blur-2xl"></div>

                            <div className="p-8 relative z-10 text-center">
                                <div className="w-24 h-24 mx-auto bg-white/10 rounded-full backdrop-blur-sm p-1 border-2 border-white/20 mb-4">
                                    <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-3xl font-bold">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold mb-1">{selectedUser.name}</h2>
                                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm border border-white/10">
                                    {getRoleLabel(selectedUser.role)}
                                </span>

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                        <div className="text-xs text-slate-400 mb-1">Toplam Çalışma</div>
                                        <div className="text-xl font-bold">{stats?.workDays || 0} Gün</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                        <div className="text-xs text-slate-400 mb-1">Son Görülme</div>
                                        <div className="text-sm font-medium truncate">
                                            {stats?.lastSeen
                                                ? new Date(stats.lastSeen).toLocaleDateString('tr-TR')
                                                : '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3 text-sm text-slate-300 text-left">
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-blue-400" />
                                        <span>+90 5XX XXX XX XX (Örnek)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-purple-400" />
                                        <span>İstanbul, Türkiye</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-green-400" />
                                        <span>Kayıt: {new Date(selectedUser.created_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => handleDelete(selectedUser.id, selectedUser.name)}
                                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-medium"
                            >
                                <Trash2 size={18} />
                                Kullanıcıyı Sil
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 hidden md:block">
                        <User size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Detaylarını görüntülemek için soldan bir personel seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
