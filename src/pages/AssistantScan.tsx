import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MapPin, LogIn, LogOut, AlertTriangle, RefreshCw, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AssistantScan() {
    const { selectedUserId, selectedUserName, clearSelectedUser } = useAuth();
    const navigate = useNavigate();

    const [scanning, setScanning] = useState(false);
    const [scanMode, setScanMode] = useState<'check_in' | 'check_out' | null>(null);
    const [loading, setLoading] = useState(false);
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
            const { data: { user } } = await supabase.auth.getUser();

            // Lokasyon verisi opsiyonel 
            const mockLocation = { latitude: 0, longitude: 0, accuracy: 0 };

            const { error } = await supabase.from('attendance').insert({
                user_id: selectedUserId,
                type: type,
                timestamp: new Date().toISOString(),
                location: mockLocation,
                device_info: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    method: 'kiosk_qr'
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
                    <h2 className="text-xl font-bold text-white">Personel Paneli</h2>
                    <p className="text-blue-400 text-sm mt-1">{selectedUserName}</p>
                </div>

                <div className="p-6">
                    {message && (
                        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="shrink-0" /> : <XCircle className="shrink-0" />}
                            <div>
                                <p className="font-medium">{message.text}</p>
                                {message.type === 'check_in_error' && (
                                    <button
                                        onClick={() => { clearSelectedUser(); navigate('/login'); }}
                                        className="mt-2 text-sm underline hover:text-red-800"
                                    >
                                        Çıkış Yap ve Tekrar Dene
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {scanning ? (
                        <div className="space-y-4">
                            <div className="bg-black rounded-2xl overflow-hidden aspect-square relative">
                                <Scanner
                                    onScan={handleKioskScan}
                                    onError={(e) => console.log(e)}
                                    components={{ audio: false, tracker: false }}
                                />
                                <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none"></div>
                                <div className="absolute top-4 left-0 w-full text-center text-white bg-black/50 py-1 text-sm">
                                    Kiosk Ekranındaki QR Kodu Okutun
                                </div>
                            </div>
                            <button
                                onClick={() => setScanning(false)}
                                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium"
                            >
                                İptal Et
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <button
                                onClick={() => startScan('check_in')}
                                disabled={loading}
                                className="h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-green-500/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center text-white gap-3"
                            >
                                <LogIn size={48} />
                                <span className="text-2xl font-bold">Giriş Yap</span>
                            </button>

                            <button
                                onClick={() => startScan('check_out')}
                                disabled={loading}
                                className="h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center text-white gap-3"
                            >
                                <LogOut size={48} />
                                <span className="text-2xl font-bold">Çıkış Yap</span>
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-center text-sm text-slate-400">
                        <p>Güvenli Kiosk Sistemi Aktif</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
