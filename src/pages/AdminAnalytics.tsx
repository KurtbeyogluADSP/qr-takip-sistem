import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Calendar, ChevronLeft, ChevronRight, Download, Users } from 'lucide-react';

interface AnalyticStat {
    user_id: string;
    user_name: string;
    total_work_days: number;
    avg_entry_time: string;
    avg_exit_time: string;
    total_hours: number;
}

export default function AdminAnalytics() {
    const [stats, setStats] = useState<AnalyticStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [targetDate, setTargetDate] = useState(new Date());

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Format date as YYYY-MM-DD for Postgres
            const dateStr = targetDate.toISOString().split('T')[0];
            const { data, error } = await supabase.rpc('get_monthly_analytics', { target_date: dateStr });

            if (error) throw error;
            setStats(data || []);
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            alert('Failed to fetch analytics: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [targetDate]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(targetDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setTargetDate(newDate);
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" />
                        Personel Analizleri
                    </h1>
                    <p className="text-slate-500">Aylık çalışma ve verimlilik raporları</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-4 font-semibold text-slate-700 min-w-[150px] justify-center">
                        <Calendar size={18} className="text-blue-500" />
                        {formatMonth(targetDate)}
                    </div>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        disabled={targetDate > new Date()}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-500"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <th className="p-4 pl-6">Personel Adı</th>
                                    <th className="p-4 text-center">Çalışılan Gün</th>
                                    <th className="p-4 text-center">Ort. Giriş</th>
                                    <th className="p-4 text-center">Ort. Çıkış</th>
                                    <th className="p-4 text-center">Toplam Saat</th>
                                    <th className="p-4 text-right pr-6">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {stats.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                            Bu ay için veri bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    stats.map((stat) => (
                                        <tr key={stat.user_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 pl-6 font-medium text-slate-800 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {stat.user_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {stat.user_name}
                                            </td>
                                            <td className="p-4 text-center text-slate-600">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {stat.total_work_days} gün
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-slate-600 font-mono">
                                                {stat.avg_entry_time || '-'}
                                            </td>
                                            <td className="p-4 text-center text-slate-600 font-mono">
                                                {stat.avg_exit_time || '-'}
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-700">
                                                {stat.total_hours} sa
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                {/* Simple visual indicator based on hours (assuming ~160h is full time) */}
                                                <div className="flex justify-end">
                                                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${stat.total_hours > 160 ? 'bg-green-500' : stat.total_hours > 100 ? 'bg-blue-500' : 'bg-orange-400'}`}
                                                            style={{ width: `${Math.min((stat.total_hours / 180) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Users size={14} />
                            Toplam {stats.length} personel listelendi
                        </div>
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <Download size={14} />
                            CSV İndir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
