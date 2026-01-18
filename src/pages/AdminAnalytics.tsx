import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Calendar, ChevronLeft, ChevronRight, Download, Users, Settings, Eye, Calculator } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import UserDetailModal from '../components/UserDetailModal';

// Merged type for logic
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

    // Payroll & Settings State
    const [hourlyWage, setHourlyWage] = useState<string>("0");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Detail View State
    const [width, setWidth] = useState<number>(window.innerWidth);
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Fetch all non-admin users to ensure everyone is listed
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, name')
                .neq('role', 'admin')
                .order('name');

            if (usersError) throw usersError;

            // 2. Fetch analytics data for the target month
            const dateStr = targetDate.toISOString().split('T')[0];
            const { data: analytics, error: analyticsError } = await supabase.rpc('get_monthly_analytics', { target_date: dateStr });

            if (analyticsError) throw analyticsError;

            // 3. Merge data (Left Join logic in frontend)
            const mergedStats: AnalyticStat[] = (users || []).map(user => {
                const stat = (analytics || []).find((s: AnalyticStat) => s.user_id === user.id);
                return {
                    user_id: user.id,
                    user_name: user.name,
                    total_work_days: stat?.total_work_days || 0,
                    avg_entry_time: stat?.avg_entry_time || '-',
                    avg_exit_time: stat?.avg_exit_time || '-',
                    total_hours: stat?.total_hours || 0
                };
            });

            setStats(mergedStats);
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'hourly_wage')
            .single();

        if (data) {
            setHourlyWage(data.value);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        fetchSettings();
    }, [targetDate]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(targetDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setTargetDate(newDate);
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    };

    const handleUserClick = (user: { id: string, name: string }) => {
        setSelectedUser(user);
        setIsDetailOpen(true);
    };

    // Calculate Estimated Pay
    const calculatePay = (hours: number) => {
        const wage = parseFloat(hourlyWage) || 0;
        return (hours * wage).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" />
                        Personel Maaş & Analiz
                    </h1>
                    <p className="text-slate-500 text-sm">Aylık çalışma ve hak ediş raporları</p>
                </div>

                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-100 rounded-xl hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Settings size={16} />
                        <span className="hidden md:inline">Ayarlar</span>
                        <span className="md:hidden">Ücret</span>
                    </button>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2 px-2 font-semibold text-slate-700 w-[140px] justify-center text-sm md:text-base">
                            <Calendar size={16} className="text-blue-500" />
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
                                    <th className="p-4 pl-6">Personel</th>
                                    <th className="p-4 text-center hidden md:table-cell">Gün</th>
                                    <th className="p-4 text-center hidden md:table-cell">Saat</th>
                                    <th className="p-4 text-right bg-blue-50/50">Tahmini Maaş</th>
                                    <th className="p-4 text-center">Detay</th>
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
                                        <tr key={stat.user_id} className="hover:bg-slate-50 transition-colors group cursor-pointer md:cursor-default"
                                            onClick={() => width < 768 && handleUserClick({ id: stat.user_id, name: stat.user_name })}
                                        >
                                            <td className="p-4 pl-6 font-medium text-slate-800 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {stat.user_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{stat.user_name}</span>
                                                    <span className="text-xs text-slate-400 md:hidden">{stat.total_hours} Saat / {stat.total_work_days} Gün</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-slate-600 hidden md:table-cell">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                    {stat.total_work_days}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-700 hidden md:table-cell">
                                                {stat.total_hours}
                                            </td>
                                            <td className="p-4 text-right font-mono text-green-700 bg-blue-50/30">
                                                <div className="flex items-center justify-end gap-1 font-bold">
                                                    ₺ {calculatePay(stat.total_hours)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-normal">
                                                    (₺{hourlyWage}/sa)
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUserClick({ id: stat.user_id, name: stat.user_name });
                                                    }}
                                                    className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-blue-600 opacity-60 group-hover:opacity-100"
                                                >
                                                    <Eye size={18} />
                                                </button>
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
                            Toplam {stats.length} personel
                        </div>
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors opacity-50 cursor-not-allowed" title="Yakında...">
                            <Download size={14} />
                            CSV İndir
                        </button>
                    </div>
                </div>
            )}

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentWage={hourlyWage}
                onUpdate={fetchSettings}
            />

            <UserDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                userId={selectedUser?.id || null}
                userName={selectedUser?.name || null}
                targetDate={targetDate}
            />
        </div>
    );
}
