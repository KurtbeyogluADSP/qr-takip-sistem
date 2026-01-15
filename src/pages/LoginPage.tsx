import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogIn, QrCode, ArrowLeft } from 'lucide-react';
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
                    .select('is_locked_out')
                    .eq('id', authData.user.id)
                    .single();

                if (profile?.is_locked_out) {
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
                    .select('is_locked_out')
                    .eq('id', authData.user.id)
                    .single();

                if (profile?.is_locked_out) {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <LogIn className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        clinic Assistant Login
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {mode === 'form' ? 'Enter credentials or scan admin QR' : 'Scan the QR code provided by Admin'}
                    </p>
                </div>

                {mode === 'form' ? (
                    <>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {isLoading ? 'Processing...' : 'Sign In'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setMode('scan')}
                                className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all font-medium"
                            >
                                <QrCode size={20} />
                                Scan Admin QR to Login
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="mt-8">
                        {error && (
                            <div className="mb-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
                        )}
                        <div className="bg-gray-100 rounded-lg overflow-hidden relative">
                            <div id="login-reader" className="w-full"></div>
                            {scanResult && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-blue-600 font-bold">Processing...</div>}
                        </div>
                        <button
                            onClick={() => {
                                setMode('form');
                                setScanResult(null);
                                setError(null);
                            }}
                            className="mt-6 flex items-center justify-center gap-2 w-full py-2 text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Password Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
