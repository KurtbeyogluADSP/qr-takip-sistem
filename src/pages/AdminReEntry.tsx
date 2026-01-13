import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import { RefreshCw, Unlock } from 'lucide-react';

export default function AdminReEntry() {
    const [qrToken, setQrToken] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const generateToken = async () => {
        setLoading(true);
        const timestamp = Date.now();
        // Token format: re_entry:timestamp:random
        const newToken = `re_entry:${timestamp}:${Math.random().toString(36).substring(7)}`;

        const { error } = await supabase
            .from('qr_tokens')
            .insert({
                token: newToken,
                type: 're_entry',
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes validity
            });

        if (error) {
            console.error('Error generating token:', error);
            alert('Failed to generate QR token');
        } else {
            setQrToken(newToken);
            setTimeLeft(300); // 5 minutes in seconds
        }
        setLoading(false);
    };

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && qrToken) {
            setQrToken(''); // Clear token when expired
        }
    }, [timeLeft, qrToken]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Re-entry Permission</h1>
                <p className="text-gray-500 mt-2">Generate a temporary QR code for assistant login.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
                {!qrToken ? (
                    <div className="max-w-md">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Unlock size={40} className="text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Grant Access</h2>
                        <p className="text-gray-500 mb-8">
                            Click different buttons below to generate a one-time access QR code.
                            The assistant must scan this code using their device to log back in.
                        </p>
                        <button
                            onClick={generateToken}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 w-full"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : 'Generate Re-entry QR'}
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-blue-200 mb-6 inline-block">
                            <QRCode
                                value={qrToken}
                                size={250}
                                level="H"
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-gray-500 mb-2">This QR code is valid for:</p>
                            <div className="text-3xl font-mono font-bold text-blue-600 mb-6">
                                {formatTime(timeLeft)}
                            </div>

                            <button
                                onClick={() => setQrToken('')}
                                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                            >
                                Cancel / Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-blue-900 mb-2">Security Note</h3>
                    <p className="text-sm text-blue-700">This QR code bypasses the standard daily check-in rules. Only use this for legitimate re-entry cases.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <h3 className="font-semibold text-purple-900 mb-2">Validity</h3>
                    <p className="text-sm text-purple-700">Generated codes expire automatically after 5 minutes. The code is single-use only.</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                    <h3 className="font-semibold text-green-900 mb-2">Logging</h3>
                    <p className="text-sm text-green-700">All re-entry permissions are logged in the system audit trail for security review.</p>
                </div>
            </div>
        </div>
    );
}
