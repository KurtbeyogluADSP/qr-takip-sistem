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

    const onScanFailure = (error: any) => {
        // console.warn(error);
    };

    const handleQRLogin = async (token: string) => {
        setError(null);
        try {
            // 1. Verify Token on Backend (via RPC or direct query if RLS allows specific unauth access?)
            // Challenge: Unauthenticated user cannot query 'qr_tokens' easily if RLS blocks it.
            // Solution: We need a Supabase Edge Function OR a specific public-facing RPC to validation.
            // FOR MVP without Edge Functions: 
            // We'll trust the Client to find the user_id linked to this token (if public read allowed for re-entry tokens)
            // Actually, per SOP 'users can read their own re-entry tokens'.
            // But here we are NOT logged in.
            // FIX: We need a workaround. Let's assume there's a simple API or we temporarily allow public read for 're_entry' tokens that are active.
            // OR checks happen post-scan.
            // Let's rely on standard Auth if possible. If not, this flow effectively needs a 'Magic Link' equivalent.
            // Since we can't implement Magic Link easily without Email, we will simulate it:
            // The QR code contains the 'userId' logic or matches a record.

            // For now, let's assume the QR validates and auto-logs in via a backend mechanism we simulated.
            // Since we don't have a backend 'LoginByToken' endpoint, we might be stuck.
            // WAIT. The conversation mentions "Admin QR allows login".
            // Implementation: The QR Token acts as a one-time password.
            // Does the user have a static password? Yes. "şifre dinamik olsun".
            // Maybe we just Reset Password to the Token? Risks?
            // BETTER: Admin QR contains a temporary password?
            // Let's try: Token in DB has 'assigned_user_id'.
            // We need to 'signInWithPassword' but we don't know the password.

            // ALTERNATIVE: Use Supabase 'signInWithOtp' (Email OTP). 
            // Admin triggers OTP -> User gets code? No, user scans QR. 
            // QR = The OTP.
            // If Supabase supports 'verified token', good.

            // FALLBACK FOR DEMO:
            // We query the DB for the token (need public read on qr_tokens for validation OR admin function).
            // If valid, we manually set the session (if we have access tokens) OR
            // we tell the user "Login with this temporary password: [Token-Suffix]".
            // This is complex for Client-only.

            // Let's stick to the simplest flow that works and is secure-ish for MVP:
            // 1. Admin generates QR. QR Value = "MAGIC_LOGIN:USER_ID:SECRET"
            // 2. We use an RPC 'login_with_qr(token)' that returns a Session.
            // I will create that RPC next.

            const { data, error } = await supabase.rpc('login_with_qr', { token_input: token });
            if (error) throw error;

            // If success, set session
            if (data?.session) {
                const { error: sessionError } = await supabase.auth.setSession(data.session);
                if (sessionError) throw sessionError;
                navigate('/admin'); // or /assistant/tasks
            } else {
                throw new Error("Invalid Session Data");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'QR Login Failed');
            setScanResult(null); // Allow retry
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
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
