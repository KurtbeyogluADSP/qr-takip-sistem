import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function LoginPage() {
    const { isLoading } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'form' | 'scan'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<string | null>(null);

    // QR Scanner Effect
    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;
        if (mode === 'scan' && !scanResult) {
            scanner = new Html5QrcodeScanner(
                "login-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scanner.render(onScanSuccess, onScanFailure);
        }
        return () => {
            if (scanner) scanner.clear().catch(console.error);
        };
    }, [mode, scanResult]);

    const onScanSuccess = async (decodedText: string) => {
        setScanResult(decodedText);
        try {
            const payload = JSON.parse(decodedText);

            if (payload.type !== 're_entry_auth' || !payload.email || !payload.password) {
                throw new Error("Invalid Re-entry QR Code");
            }

            if (Date.now() - payload.timestamp > 300000) {
                throw new Error("QR Code Expired");
            }

            await handleQRLogin(payload.email, payload.password);
        } catch (e: any) {
            console.error("QR Logic Error:", e);
            setError("Invalid QR Code. Please scan a Re-entry QR provided by Admin.");
            setScanResult(null);
        }
    };

    const onScanFailure = (_error: any) => {
        // console.warn(error);
    };

    const handleQRLogin = async (emailInfo: string, tempPass: string) => {
        setError(null);
        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: emailInfo,
                password: tempPass,
            });

            if (error) throw error;

            if (authData.user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('is_locked_out, role')
                    .eq('id', authData.user.id)
                    .single();

                // Admin asla kilitlenemez
                if (profile?.is_locked_out && profile?.role !== 'admin') {
                    await supabase.auth.signOut();
                    throw new Error("Account is locked. Please use Admin Re-entry QR.");
                }
            }

            navigate('/admin');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'QR Login Failed');
            setScanResult(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // Check if user is locked out
            if (authData.user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('is_locked_out, role')
                    .eq('id', authData.user.id)
                    .single();

                // Admin asla kilitlenemez
                if (profile?.is_locked_out && profile?.role !== 'admin') {
                    await supabase.auth.signOut();
                    throw new Error("Account is locked. Please use Admin Re-entry QR.");
                }
            }

            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10 backdrop-blur-sm bg-white/90">
                <div className="text-center flex flex-col items-center">
                    <img src="/logo.jpg" alt="Kurtbeyoğlu Logo" className="w-32 h-32 object-contain mb-6 drop-shadow-md" />

                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Kurtbeyoğlu ADSP
                    </h2>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-1 mb-8">
                        Personel QR Takip Sistemi
                    </p>

                    <p className="text-sm text-gray-600">
                        {mode === 'form' ? 'Giriş bilgilerinizi giriniz veya QR okutunuz' : 'Yönetici QR Kodunu Okutunuz'}
                    </p>
                </div>

                {mode === 'form' ? (
                    <>
                        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                        placeholder="E-posta Adresi"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                        placeholder="Şifre"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 font-medium animate-pulse">{error}</div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? 'İşleniyor...' : 'Giriş Yap'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-400">veya</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setMode('scan')}
                                className="flex items-center justify-center gap-3 w-full py-3.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-teal-400 hover:text-teal-700 transition-all font-semibold group"
                            >
                                <QrCode size={20} className="group-hover:scale-110 transition-transform" />
                                Admin QR ile Giriş Yap
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="mt-6">
                        {error && (
                            <div className="mb-4 text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 font-medium">{error}</div>
                        )}
                        <div className="bg-gray-900 rounded-2xl overflow-hidden relative shadow-inner border border-gray-800">
                            <div id="login-reader" className="w-full h-[300px] bg-black"></div>
                            {scanResult && <div className="absolute inset-0 bg-white/90 flex items-center justify-center text-teal-600 font-bold text-lg animate-pulse">İşleniyor...</div>}
                        </div>
                        <button
                            onClick={() => {
                                setMode('form');
                                setScanResult(null);
                                setError(null);
                            }}
                            className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-gray-500 hover:text-gray-800 transition-colors font-medium"
                        >
                            <ArrowLeft size={18} />
                            Şifre ile Giriş'e Dön
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-6 text-center text-gray-400 text-xs">
                &copy; 2024 Kurtbeyoğlu ADSP. Tüm hakları saklıdır.
            </div>
        </div>
    );
}
