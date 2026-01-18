import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { MapPin, LogIn, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';

// CLINIC COORDINATES: Silivri Mustafa Kurtbeyoğlu Polikliniği
// Adres: Yeni Mah., Doktor Sadık Ahmet Cad., 5J, Silivri, İstanbul
const CLINIC_LAT = 41.080856;
const CLINIC_LNG = 28.249029;
const MAX_DISTANCE_METERS = 300; // 300m tolerans (GPS sapmaları için)

export default function AssistantScan() {
    const { selectedUserId, selectedUserName, clearSelectedUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'check_in_error' | 'error'; text: string } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [locError, setLocError] = useState<string | null>(null);

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    const updateLocation = () => {
        setLoading(true);
        setLocError(null);

        if (!navigator.geolocation) {
            setLocError("Tarayıcınız konum servisini desteklemiyor.");
            setLoading(false);
            return;
        }
        const [message, setMessage] = useState<{ type: 'success' | 'error' | 'check_in_error', text: string } | null>(null);

        const handleKioskScan = async (result: any) => {
            if (!result) return;

            // QR datayı al (bazen result.text, bazen result[0].rawValue formatında gelebiliyor kütüphaneye göre)
            const token = result[0]?.rawValue || result?.text || result;

            if (!token) return;

            setLoading(true);
            setScanning(false); // Kamerayı kapat

            try {
                // 1. Token Validasyonu
                const { data: tokenData, error: tokenError } = await supabase
                    .from('qr_tokens')
                    .select('*')
                    .eq('token', token)
                    //.eq('type', 'kiosk_entry') // İleride farklı tipler olabilir ama şimdilik güvenlik için bu eklenebilir
                    .gt('expires_at', new Date().toISOString()) // Süresi dolmamış
                    .single();

                if (tokenError || !tokenData) {
                    throw new Error('Geçersiz veya süresi dolmuş QR Kod. Lütfen Kiosk ekranını tekrar okutun.');
                }

                // 2. İşlem Yap (Giriş veya Çıkış)
                await processAttendance(scanMode!);

            } catch (error: any) {
                console.error(error);
                setMessage({ type: 'error', text: error.message || 'QR okuma hatası.' });
            } finally {
                setLoading(false);
                setScanMode(null);
            }
        };

        const processAttendance = async (type: 'check_in' | 'check_out') => {
            try {
                const { data: { user } } = await supabase.auth.getUser(); // Anon user olsa bile id lazım değil, selectedUserId var

                // Lokasyon verisi opsiyonel (artık zorunlu değil ama loglamak isterseniz ekleyebilirsiniz)
                const mockLocation = { latitude: 0, longitude: 0, accuracy: 0 };

                const { error } = await supabase.from('attendance').insert({
                    user_id: selectedUserId,
                    type: type,
                    timestamp: new Date().toISOString(),
                    location: mockLocation,
                    device_info: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        method: 'kiosk_qr' // Analitik için
                    }
                });

                if (error) {
                    // RLS ve KULLANICI_SILINMIS hataları burada
                    if (error.code === '23503' || error.message.includes('foreign key')) {
                        throw new Error("KULLANICI_SILINMIS");
                    }
                    throw error;
                }

                setMessage({
                    type: 'success',
                    text: type === 'check_in' ? `Hoş geldin ${selectedUserName}, giriş başarılı!` : `Güle güle ${selectedUserName}, çıkış yapıldı.`
                });

            } catch (error: any) {
                if (error.message === "KULLANICI_SILINMIS") {
                    setMessage({ type: 'check_in_error', text: 'Kullanıcı kaydı bulunamadı. Lütfen çıkış yapın.' });
                } else {
                    throw error;
                }
            }
        };

        const startScan = (mode: 'check_in' | 'check_out') => {
            setScanMode(mode);
            setScanning(true);
            setMessage(null);
        };

        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-slate-900 p-6 text-center relative">
                        <button
                            onClick={() => { clearSelectedUser(); navigate('/login'); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <ArrowLeft />
                        </button>
                        <span className="font-bold text-lg">Giriş Yap</span>
                    </button>

                    <button
                        onClick={() => handleAttendance('check_out')}
                        disabled={loading || !!message || (distance !== null && distance > MAX_DISTANCE_METERS)}
                        className="flex flex-col items-center justify-center p-6 bg-red-500 active:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-red-200 transition-all transform active:scale-95"
                    >
                        <LogOut size={32} className="mb-2" />
                        <span className="font-bold text-lg">Çıkış Yap</span>
                    </button>
                </div>

                {message && (
                    <div className={`mt-6 p-4 rounded-xl w-full text-center animate-fade-in ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <p className="font-bold">{message.text}</p>
                        {message.type === 'success' && (
                            <button
                                onClick={() => setMessage(null)}
                                className="text-xs mt-2 underline"
                            >
                                Yeni İşlem
                            </button>
                        )}
                        {message.type === 'check_in_error' && (
                            <button
                                onClick={() => {
                                    clearSelectedUser();
                                    window.location.href = '/login';
                                }}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition"
                            >
                                Çıkış Yap ve Tekrar Dene
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }
