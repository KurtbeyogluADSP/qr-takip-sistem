import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import { RefreshCw, Unlock, Users, AlertCircle } from 'lucide-react';
import type { Profile } from '../types';

export default function AdminReEntry() {
    const [qrValue, setQrValue] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [assistants, setAssistants] = useState<Profile[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssistants();
    }, []);

    const fetchAssistants = async () => {
        try {
            // Use the RPC we created
            const { data, error } = await supabase.rpc('get_assistants_list');
            if (error) throw error;
            setAssistants(data || []);
        } catch (err: any) {
            console.error('Error fetching assistants:', err);
            // Fallback for dev/demo if RPC fails or returns empty (e.g. no assistants yet)
            // setError("Could not load assistants list.");
        }
    };

    const generateReEntryCredentials = async () => {
        if (!selectedUser) {
            setError("Please select an assistant first.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            // STRICT RE-ENTRY: Generate a token, do NOT reset password.
            // Token is a simple UUID or unique string.
            const token = `re-entry-${Math.random().toString(36).substring(2)}-${Date.now()}`;

            // Insert into qr_tokens
            const { error: insertError } = await supabase.from('qr_tokens').insert({
                token: token,
                type: 're_entry_token', // New strict type
                assigned_user_id: selectedUser,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 mins
            });

            if (insertError) throw insertError;

            // QR Value is just the token string now
            setQrValue(token);
            setTimeLeft(300);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate re-entry token');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && qrValue) {
            setQrValue(''); // Expire the view
        }
    }, [timeLeft, qrValue]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Re-entry Permission</h1>
                <p className="text-gray-500 mt-2">Generate a login QR code for a specific assistant.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-50 p-3 rounded-full">
                            <Users className="text-blue-600 h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Select Assistant</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Choose the assistant who needs to log back in. The system will generate a temporary 5-minute login credential for them.
                        </p>

                        {assistants.length === 0 ? (
                            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <div>
                                    No assistants found. Ensure users with 'assistant' role exist in the database.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {assistants.map(user => (
                                    <label
                                        key={user.id}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedUser === user.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="assistant"
                                            value={user.id}
                                            checked={selectedUser === user.id}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div className="ml-3">
                                            <div className="font-medium text-gray-900">{user.email}</div>
                                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                        </div>
                                        {user.is_locked_out && (
                                            <span className="ml-auto px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                                Locked
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={generateReEntryCredentials}
                            disabled={loading || !selectedUser}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : 'Generate Access QR'}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: QR Display */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                    {!qrValue ? (
                        <div className="py-12 opacity-50">
                            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Unlock size={40} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500">QR Code will appear here</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in w-full">
                            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-blue-200 mb-6 inline-block">
                                <QRCode
                                    value={qrValue}
                                    size={220}
                                    level="H"
                                />
                            </div>

                            <div className="text-center">
                                <p className="text-gray-500 mb-2">Valid for login:</p>
                                <div className="text-3xl font-mono font-bold text-blue-600 mb-6">
                                    {formatTime(timeLeft)}
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800 mb-4">
                                    <strong>Instruction:</strong> Ask the assistant to open the Login Page and switch to "Scan Admin QR" mode to scan this code.
                                </div>

                                <button
                                    onClick={() => setQrValue('')}
                                    className="text-gray-400 hover:text-gray-600 text-sm font-medium"
                                >
                                    Close / Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
