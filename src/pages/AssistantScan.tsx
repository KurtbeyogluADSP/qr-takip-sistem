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
    const { selectedUserId, selectedUserName } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const dist = calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    CLINIC_LAT,
                    CLINIC_LNG
                );
                setDistance(Math.round(dist));
                setLoading(false);
            },
            (error) => {
                setLocError("Konum alınamadı. Lütfen GPS izni verin.");
                console.error(error);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        updateLocation();
        // Auto-refresh location every 30s
        const interval = setInterval(updateLocation, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAttendance = async (type: 'check_in' | 'check_out') => {
        if (!distance || distance > MAX_DISTANCE_METERS) {
            setMessage({ type: 'error', text: `Klinikte değilsiniz! (Mesafe: ${distance}m)` });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // 1. Fingerprint Check (Device Lock)
            const fp = await fpPromise.load();
            const result = await fp.get();
            const deviceId = result.visitorId;

            // 2. Strict Device Lock Check (Anti-Buddy Punching)
            // Call the RPC to see if this device was used by anyone else today
            const { data: isDeviceSafe, error: rpcError } = await supabase
                .rpc('check_device_usage', {
                    p_device_id: deviceId,
                    p_user_id: selectedUserId
                });

            if (rpcError) throw rpcError;

            if (!isDeviceSafe) {
                throw new Error("GÜVENLİK UYARISI: Bu cihaz bugün başka bir personel tarafından kullanıldı. Lütfen kendi telefonunuzu kullanın.");
            }

            // 3. Submit to Supabase
            // Note: RLS should allow this if user_id matches
            const { error } = await supabase
                .from('attendance')
                .insert({
                    user_id: selectedUserId,
                    type: type,
                    timestamp: new Date().toISOString(),
                    device_id: deviceId,
                    status: 'approved',
                    qr_token: 'GPS_VERIFIED' // Legacy col placeholder
                });

            if (error) {
                // Handle RLS error specifically
                if (error.message.includes('row-level security')) {
                    throw new Error("Sistem hatası: Erişim reddedildi. Yönetici ile iletişime geçin.");
                }
                throw error;
            }

            setMessage({
                type: 'success',
                text: `${type === 'check_in' ? 'Giriş' : 'Çıkış'} Başarılı!`
            });

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || 'Bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-6 max-w-sm mx-auto bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Personel Paneli</h2>
            <p className="text-gray-500 mb-8">{selectedUserName}</p>

            <div className="w-full bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={20} className={distance && distance < MAX_DISTANCE_METERS ? "text-green-500" : "text-amber-500"} />
                        <span className="font-medium">Konum Durumu</span>
                    </div>
                    <button onClick={updateLocation} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <RefreshCw size={16} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
                    </button>
                </div>

                {locError ? (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {locError}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Mesafe:</span>
                            <span className={`font-mono font-bold ${distance && distance < MAX_DISTANCE_METERS ? "text-green-600" : "text-red-500"}`}>
                                {distance !== null ? `${distance}m` : 'Hesaplanıyor...'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${distance && distance < MAX_DISTANCE_METERS ? "bg-green-500" : "bg-red-400"}`}
                                style={{ width: distance ? `${Math.min(100, Math.max(0, 100 - (distance / MAX_DISTANCE_METERS) * 100))}%` : '0%' }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 text-right mt-1">Limit: {MAX_DISTANCE_METERS}m</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
                <button
                    onClick={() => handleAttendance('check_in')}
                    disabled={loading || !!message || (distance !== null && distance > MAX_DISTANCE_METERS)}
                    className="flex flex-col items-center justify-center p-6 bg-green-500 active:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-green-200 transition-all transform active:scale-95"
                >
                    <LogIn size={32} className="mb-2" />
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
                </div>
            )}
        </div>
    );
}
