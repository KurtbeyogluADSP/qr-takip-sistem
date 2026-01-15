import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Moon, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleCloseDay = async () => {
        if (!window.confirm("ARE YOU SURE?\n\nThis will force-checkout ALL active assistants and mark the day as closed.\nThis action cannot be undone for today.")) {
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const adminName = user?.user_metadata?.name || 'Admin';

            const { data, error } = await supabase.rpc('admin_close_day', { admin_name: adminName });

            if (error) throw error;

            setResult(`Day closed successfully! ${data.auto_checkout_count} users were auto-checked out.`);
        } catch (err: any) {
            console.error(err);
            alert("Error closing day: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>

            {/* Close Day Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Moon size={120} />
                </div>

                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Moon className="text-blue-400" />
                    End of Day Protocol
                </h2>
                <p className="text-slate-400 mb-6 max-w-xl">
                    Clicking this will explicitly close the clinic day. All assistants who forgot to check out will be automatically checked out by the system.
                </p>

                {result ? (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3 text-green-200">
                        <CheckCircle />
                        {result}
                    </div>
                ) : (
                    <button
                        onClick={handleCloseDay}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-red-900/50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <AlertTriangle size={20} />}
                        CLOSE CLINIC DAY
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <a href="/admin/users" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            Manage Users
                        </a>
                        <a href="/admin/re-entry" className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors">
                            Re-entry Generator
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
