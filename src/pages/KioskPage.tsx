import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function KioskPage() {
    const { isKiosk, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [qrValue, setQrValue] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState(15);

    // Auth check
    useEffect(() => {
        if (!isKiosk && !isAdmin) {
            navigate('/login');
        }
    }, [isKiosk, isAdmin, navigate]);

    // Generate QR loop
    useEffect(() => {
        generateKioskQR(); // Initial

        const interval = setInterval(() => {
            generateKioskQR();
        }, 15000); // 15 seconds

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15));
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, []);

    const generateKioskQR = async () => {
        const token = `kiosk-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;

        // 1. Save new token
        const { error } = await supabase.from('qr_tokens').insert({
            token: token,
            type: 'kiosk_entry',
            expires_at: new Date(Date.now() + 60 * 1000).toISOString() // Valid for 60s (saat farkı ve yavaş okuma için buffer)
        });

        if (error) console.error('Token create error', error);

        setQrValue(token);
        setTimeLeft(15);

        // 2. Clean up old tokens (Self-maintaining database)
        // Arka planda sessizce 1 saat öncekileri siler
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await supabase.from('qr_tokens').delete().lt('created_at', oneHourAgo);
    };

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

            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in relative z-10">
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Giriş / Çıkış</h2>
                    <p className="text-slate-500">Lütfen telefonunuzdan okutunuz</p>
                </div>

                <div className="bg-white p-4 border-4 border-slate-100 rounded-2xl mb-6 shadow-inner relative">
                    <QRCode value={qrValue} size={280} level="H" />

                    {/* Timer Circle */}
                    <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                        {timeLeft}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Sistem Aktif - Kod Otomatik Yenileniyor
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-500 text-sm">
                Güvenli Kiosk Modu v1.0 • Device ID: {navigator.userAgent.substring(0, 20)}...
            </div>
        </div>
    );
}
