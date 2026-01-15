import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Lock, LogOut } from 'lucide-react';

export default function LockedPage() {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // If unlocked externally, redirect automatically
    useEffect(() => {
        if (profile && !profile.is_locked_out) {
            navigate('/assistant/scan');
        }
    }, [profile, navigate]);

    const handleScan = async (result: any) => {
        if (!result) return;
        const token = result[0]?.rawValue;
        if (!token) return;

        setIsScanning(false);
        setError(null);

        try {
            const { data: _data, error: _error } = await supabase.rpc('process_reentry_token', {
                token_text: token
            });

            if (error) throw error;

            setSuccess("Unlock Successful! Redirecting...");

            // Refresh profile logic triggers via AuthProvider subscription usually, but we can force redirect
            // Ideally we wait for AuthProvider to see the update, but let's give it a moment
            setTimeout(() => {
                window.location.href = '/assistant/scan';
            }, 1000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Invalid Token");
            setIsScanning(true); // Retry
        }
    };

    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                <div className="bg-red-100 p-4 rounded-full inline-flex mb-6">
                    <Lock size={48} className="text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-red-700 mb-2">Account Locked</h1>
                <p className="text-slate-500 mb-8">
                    Your session has ended. To resume access, you must scan the Re-entry QR code provided by the Admin.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm font-medium animate-shake">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        {success}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border-2 border-slate-200 aspect-square relative bg-black">
                    {isScanning ? (
                        <Scanner
                            onScan={handleScan}
                            onError={(error) => console.log(error)}
                            styles={{ container: { width: '100%' } }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white">
                            {!success && (
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                                >
                                    Tap to Scan Admin QR
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => signOut()}
                className="mt-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <LogOut size={16} />
                <span>Log out completely</span>
            </button>
        </div>
    );
}
