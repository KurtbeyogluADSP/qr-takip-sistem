import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface DailyLog {
    work_date: string;
    first_check_in: string;
    last_check_out: string;
    daily_hours: number;
}

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    userName: string | null;
    targetDate: Date;
}

export default function UserDetailModal({ isOpen, onClose, userId, userName, targetDate }: UserDetailModalProps) {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const dateStr = targetDate.toISOString().split('T')[0];
                const { data, error } = await supabase.rpc('get_user_daily_details', {
                    target_user_id: userId,
                    target_date: dateStr
                });

                if (error) throw error;
                setLogs(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && userId) {
            fetchDetails();
        }
    }, [isOpen, userId, targetDate]);

    if (!isOpen) return null;

    const monthName = targetDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{userName}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                            <Calendar size={14} />
                            {monthName} Detayları
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-0 flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-100 border-t-blue-500"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <AlertCircle size={32} className="mb-2 opacity-50" />
                            <p>Bu ay için kayıt bulunamadı.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr className="text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                                    <th className="p-4 pl-6">Tarih</th>
                                    <th className="p-4 text-center">Giriş</th>
                                    <th className="p-4 text-center">Çıkış</th>
                                    <th className="p-4 text-right pr-6">Süre</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {logs.map((log) => (
                                    <tr key={log.work_date} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-slate-700">
                                            {new Date(log.work_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                                        </td>
                                        <td className="p-4 text-center font-mono text-green-600">
                                            {log.first_check_in || '-'}
                                        </td>
                                        <td className="p-4 text-center font-mono text-red-600">
                                            {log.last_check_out || '-'}
                                        </td>
                                        <td className="p-4 text-right pr-6 font-bold text-slate-800">
                                            {log.daily_hours} sa
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-right text-xs text-slate-400">
                    * Süreler ilk giriş ve son çıkış baz alınarak hesaplanmıştır.
                </div>
            </div>
        </div>
    );
}
