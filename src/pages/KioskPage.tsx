import { useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ScanInfo {
    userName: string;
    type: 'check_in' | 'check_out';
    timestamp: string;
    status: 'early' | 'optimal' | 'late';
    minutesDiff: number;
}

export default function KioskPage() {
    const { isKiosk, isAdmin, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    const [qrValue, setQrValue] = useState<string>('');
    const [displayCode, setDisplayCode] = useState<string>('');

    // Scan feedback state
    const [scanInfo, setScanInfo] = useState<ScanInfo | null>(null);
    const [cooldown, setCooldown] = useState(0);

    // Auth check
    useEffect(() => {
        if (!isLoading && !isKiosk && !isAdmin) {
            navigate('/login');
        }
    }, [isKiosk, isAdmin, navigate, isLoading]);

    // Generate new QR token
    const generateNewToken = useCallback(async () => {
        const code = Math.floor(Math.random() * 90 + 10).toString();
        const token = `kiosk-${code}-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;

        const { error } = await supabase.from('qr_tokens').insert({
            token: token,
            type: 'kiosk_entry',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 saat
        });

        if (error) {
            console.error('Token create error', error);
            return;
        }

        setQrValue(token);
        setDisplayCode(code);

        // Eski tokenları temizle
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await supabase.from('qr_tokens').delete().lt('created_at', oneHourAgo);
    }, []);

    // Initialize - tek seferlik token oluştur
    useEffect(() => {
        generateNewToken();
    }, [generateNewToken]);

    // Polling - her 3 saniyede son attendance kaydını kontrol et
    useEffect(() => {
        if (cooldown > 0) return; // cooldown varken polling yapma

        const interval = setInterval(async () => {
            // Son 5 saniye içinde gelen attendance kaydını kontrol et
            const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

            const { data } = await supabase
                .from('attendance')
                .select('*, users!inner(name)')
                .gt('timestamp', fiveSecondsAgo)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (data && data.device_info?.method === 'kiosk_qr') {
                // Yeni tarama algılandı!
                const userName = data.users?.name || 'Personel';
                const type = data.type as 'check_in' | 'check_out';
                const timestamp = new Date(data.timestamp);

                // Mesai durumu hesapla (varsayılan: 09:00 başlangıç)
                const workStartHour = 9;
                const workStartMinute = 0;
                const now = new Date();
                const workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), workStartHour, workStartMinute);
                const diffMinutes = Math.round((timestamp.getTime() - workStart.getTime()) / 60000);

                let status: 'early' | 'optimal' | 'late' = 'optimal';
                if (type === 'check_in') {
                    if (diffMinutes > 5) status = 'late';
                    else if (diffMinutes < -5) status = 'early';
                }

                setScanInfo({
                    userName,
                    type,
                    timestamp: timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    status,
                    minutesDiff: Math.abs(diffMinutes)
                });

                // 60 saniye cooldown başlat
                setCooldown(60);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [cooldown]);

    // Cooldown countdown
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    // Cooldown bitti - yeni QR oluştur
                    setScanInfo(null);
                    generateNewToken();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown, generateNewToken]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Yükleniyor...</div>
            </div>
        );
    }

    // Hoşgeldin ekranı (cooldown during scan feedback)
    if (scanInfo && cooldown > 0) {
        const isCheckIn = scanInfo.type === 'check_in';
        const statusConfig = {
            early: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', message: `${scanInfo.minutesDiff} dk erkencisin` },
            optimal: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', message: 'Tebrikler! Optimal saat' },
            late: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20', message: `${scanInfo.minutesDiff} dk geç kaldın` }
        };
        const status = statusConfig[scanInfo.status];
        const StatusIcon = status.icon;

        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden text-white">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-600/20 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/20 blur-3xl pointer-events-none"></div>

                <header className="absolute top-8 left-8 flex items-center gap-4">
                    <img src="/logo.jpg" className="w-16 h-16 rounded-xl shadow-lg bg-white p-1" alt="Logo" />
                    <div>
                        <h1 className="text-2xl font-bold">Kurtbeyoğlu ADSP</h1>
                        <p className="text-slate-400">Personel Takip Sistemi</p>
                    </div>
                </header>

                <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in relative z-10 w-full max-w-lg mx-4 border border-white/20">
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <CheckCircle size={56} className="text-green-400" />
                    </div>

                    <h2 className="text-4xl font-bold mb-2">
                        {isCheckIn ? 'Hoş Geldin' : 'Güle Güle'}
                    </h2>
                    <p className="text-3xl font-semibold text-green-400 mb-6">{scanInfo.userName}</p>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-slate-300">{isCheckIn ? 'Giriş' : 'Çıkış'} Saati:</span>
                        <span className="text-2xl font-mono font-bold">{scanInfo.timestamp}</span>
                    </div>

                    {isCheckIn && (
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl ${status.bg}`}>
                            <StatusIcon size={24} className={status.color} />
                            <span className={`text-lg font-medium ${status.color}`}>{status.message}</span>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col items-center">
                        <p className="text-slate-400 text-sm mb-2">Yeni QR oluşturuluyor...</p>
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-2xl font-bold">{cooldown}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal QR ekranı
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden text-white">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-3xl pointer-events-none"></div>

            <header className="absolute top-8 left-8 flex items-center gap-4">
                <img src="/logo.jpg" className="w-16 h-16 rounded-xl shadow-lg bg-white p-1" alt="Logo" />
                <div>
                    <h1 className="text-2xl font-bold">Kurtbeyoğlu ADSP</h1>
                    <p className="text-slate-400">Personel Takip Kiosk Sistemi</p>
                </div>
            </header>

            <button
                onClick={logout}
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 transition-all"
                title="Kiosk Kapat"
            >
                <LogOut size={20} />
            </button>

            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in relative z-10 w-full max-w-md mx-4">
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Giriş / Çıkış</h2>
                    <p className="text-slate-500">Lütfen telefonunuzdan okutunuz</p>
                </div>

                <div className="bg-white p-4 border-4 border-slate-100 rounded-2xl mb-6 shadow-inner relative">
                    {qrValue && <QRCode value={qrValue} size={280} level="H" />}
                </div>

                {/* Manual Entry Code Display */}
                <div className="w-full bg-slate-50 rounded-xl p-4 mb-4 text-center border border-slate-200">
                    <p className="text-slate-500 text-sm mb-1">QR Okutamıyor musunuz?</p>
                    <div className="text-4xl font-black text-slate-800 tracking-widest font-mono">
                        {displayCode}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Ekranda bu sayıyı seçiniz</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Sistem Aktif - Her Taramada Yenileniyor
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-500 text-sm">
                Kiosk Sistemi v2.0 • Scan-Triggered Mode
            </div>
        </div>
    );
}
