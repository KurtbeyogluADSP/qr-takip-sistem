import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Lock, Users, QrCode, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function LoginPage() {
    const { login, isLoading, selectedUserId, setSelectedUser } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState<'select' | 'admin' | 'staff'>('select');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    // Eğer çalışan zaten giriş yapmışsa direkt yönlendir
    useEffect(() => {
        if (selectedUserId) {
            navigate('/assistant/scan');
        }
    }, [selectedUserId, navigate]);

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const ok = login(username, password);
        if (ok) {
            navigate('/admin');
        } else {
            setError('Kullanıcı adı veya şifre hatalı');
        }
    };

    const handleStaffScan = async (result: any) => {
        if (!result) return;
        const token = result[0]?.rawValue;
        if (!token) return;

        setScanning(false);
        setError(null);

        try {
            // Token'ı kontrol et ve kullanıcıyı bul
            const { data: tokenData, error: tokenError } = await supabase
                .from('qr_tokens')
                .select('*')
                .eq('token', token)
                .is('used_at', null)
                .single();

            if (tokenError || !tokenData) {
                throw new Error('Geçersiz veya kullanılmış QR kod');
            }

            // Token süresi dolmuş mu?
            if (new Date(tokenData.expires_at) < new Date()) {
                throw new Error('QR kod süresi dolmuş');
            }

            // Kullanıcı bilgisini çek
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name')
                .eq('id', tokenData.assigned_user_id)
                .single();

            if (userError || !userData) {
                throw new Error('Kullanıcı bulunamadı');
            }

            // Token'ı kullanılmış olarak işaretle
            await supabase
                .from('qr_tokens')
                .update({ used_at: new Date().toISOString() })
                .eq('id', tokenData.id);

            // Kullanıcıyı kaydet (localStorage + state)
            setSelectedUser(userData.id, userData.name);

            setSuccess(`Hoş geldin ${userData.name}!`);

            setTimeout(() => {
                navigate('/assistant/scan');
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'Giriş başarısız');
            setScanning(true);
        }
    };

    // Ana seçim ekranı
    if (mode === 'select') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10">
                    <div className="text-center flex flex-col items-center">
                        <img src="/logo.jpg" alt="Kurtbeyoğlu Logo" className="w-28 h-28 object-contain mb-4 drop-shadow-md" />
                        <h2 className="text-2xl font-bold text-gray-900">Kurtbeyoğlu ADSP</h2>
                        <p className="text-gray-500 text-sm mt-1 mb-8">Personel QR Takip Sistemi</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('staff')}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/30 hover:from-teal-700 hover:to-teal-600 transition-all"
                        >
                            <Users size={22} />
                            Çalışan Girişi
                        </button>

                        <button
                            onClick={() => setMode('admin')}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                            <Lock size={20} />
                            Admin Girişi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Admin giriş ekranı
    if (mode === 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

                <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10">
                    <button onClick={() => setMode('select')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={18} /> Geri
                    </button>

                    <div className="text-center">
                        <Lock size={40} className="mx-auto text-teal-600 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Admin Girişi</h2>
                    </div>

                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Kullanıcı Adı"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all"
                        >
                            Giriş Yap
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Çalışan giriş ekranı - Admin QR bekler
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

            <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 relative z-10">
                <button onClick={() => setMode('select')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={18} /> Geri
                </button>

                <div className="text-center">
                    <QrCode size={40} className="mx-auto text-teal-600 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Çalışan Girişi</h2>
                    <p className="text-gray-500 text-sm mt-2">Admin'den giriş QR'ı alın ve okutun</p>
                </div>

                {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
                )}

                {success && (
                    <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">{success}</div>
                )}

                <div className="overflow-hidden rounded-2xl border-2 border-gray-200 aspect-square relative bg-black">
                    {scanning ? (
                        <Scanner
                            onScan={handleStaffScan}
                            onError={(error) => console.log(error)}
                            styles={{ container: { width: '100%' } }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white">
                            {!success && (
                                <button
                                    onClick={() => setScanning(true)}
                                    className="bg-teal-600 px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition"
                                >
                                    QR Taramak İçin Dokun
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400">
                    Bu cihaz size atandıktan sonra başka birisi kullanamaz
                </p>
            </div>
        </div>
    );
}
