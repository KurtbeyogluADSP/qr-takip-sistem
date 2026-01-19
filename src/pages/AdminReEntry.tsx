import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import { RefreshCw, Unlock, Users, AlertCircle } from 'lucide-react';

type UserType = {
    id: string;
    name: string;
    role: string;
    is_locked_out: boolean;
};

export default function AdminReEntry() {
    const [qrValue, setQrValue] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, role, is_locked_out')
                .neq('role', 'admin')
                .order('name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error: unknown) {
            console.error('Logout error:', error);
        }
    };

    const generateReEntryCredentials = async () => {
        if (!selectedUser) {
            setError("Lütfen bir kullanıcı seçin.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const token = `re-entry-${Math.random().toString(36).substring(2)}-${Date.now()}`;

            const { error: insertError } = await supabase.from('qr_tokens').insert({
                token: token,
                type: 'admin_reentry',
                assigned_user_id: selectedUser,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            });

            if (insertError) throw insertError;

            setQrValue(token);
            setTimeLeft(300);

        } catch (error: unknown) {
            const err = error as Error;
            console.error(err);
            setError(err.message || 'Giriş işlemi başarısız.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && qrValue) {
            setQrValue('');
        }
    }, [timeLeft, qrValue]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const selectedUserName = users.find(u => u.id === selectedUser)?.name || '';

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Tekrar Giriş İzni</h1>
                <p className="text-gray-500 mt-2">Çalışan için giriş QR kodu oluşturun.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-50 p-3 rounded-full">
                            <Users className="text-blue-600 h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Kullanıcı Seçin</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Tekrar giriş yapması gereken çalışanı seçin. Sistem 5 dakikalık geçici giriş kodu oluşturacak.
                        </p>

                        {users.length === 0 ? (
                            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <div>
                                    Kullanıcı bulunamadı. Önce Kullanıcı Yönetimi'nden kullanıcı ekleyin.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {users.map(user => (
                                    <label
                                        key={user.id}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedUser === user.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="user"
                                            value={user.id}
                                            checked={selectedUser === user.id}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500 capitalize">{user.role === 'assistant' ? 'Asistan' : user.role === 'physician' ? 'Hekim' : 'Personel'}</div>
                                        </div>
                                        {user.is_locked_out && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                                Kilitli
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={generateReEntryCredentials}
                            disabled={loading || !selectedUser}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : 'Giriş QR Oluştur'}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: QR Display */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                    {!qrValue ? (
                        <div className="py-12 opacity-50">
                            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Unlock size={40} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500">QR Kod burada görünecek</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in w-full">
                            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-blue-200 mb-6 inline-block">
                                <QRCode
                                    value={qrValue}
                                    size={220}
                                    level="H"
                                />
                            </div>

                            <div className="text-center">
                                <p className="text-gray-700 font-medium mb-2">{selectedUserName} için</p>
                                <p className="text-gray-500 mb-2">Geçerlilik süresi:</p>
                                <div className="text-3xl font-mono font-bold text-blue-600 mb-6">
                                    {formatTime(timeLeft)}
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800 mb-4">
                                    <strong>Talimat:</strong> Çalışanın bu QR kodu okutarak sisteme giriş yapmasını sağlayın.
                                </div>

                                <button
                                    onClick={() => setQrValue('')}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Kapat / Temizle
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
