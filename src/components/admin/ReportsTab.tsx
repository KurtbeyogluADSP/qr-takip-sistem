import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Calendar, TrendingUp } from 'lucide-react';

export default function ReportsTab() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        // Use the existing RPC
        const { data: analytics, error } = await supabase.rpc('get_monthly_analytics', {
            target_date: new Date().toISOString()
        });

        if (!error && analytics) {
            setData(analytics);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Raporlar hazırlanıyor...</div>;

    // Determine max values for scaling charts
    const maxHours = Math.max(...data.map(d => Number(d.total_hours) || 0), 1);


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Stats */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" />
                        Bu Ayın Özeti
                    </h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-slate-900">{data.length}</span>
                        <span className="text-slate-500 mb-1">Personel Aktif</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Calendar className="text-purple-500" />
                        Toplam Çalışma Saati
                    </h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-slate-900">
                            {data.reduce((acc, curr) => acc + (Number(curr.total_hours) || 0), 0).toFixed(1)}
                        </span>
                        <span className="text-slate-500 mb-1">Saat</span>
                    </div>
                </div>
            </div>

            {/* Charts List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <BarChart className="text-indigo-500" />
                    Personel Performans Analizi
                </h3>

                <div className="space-y-6">
                    {data.map((user) => (
                        <div key={user.user_id} className="group">
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-slate-700">{user.user_name}</span>
                                <span className="text-slate-500">{user.total_work_days} Gün / {user.total_hours} Saat</span>
                            </div>

                            {/* Visual Bar for Hours */}
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${(Number(user.total_hours) / maxHours) * 100}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Ort. Giriş: {user.avg_entry_time || '--:--'}</span>
                                <span>Ort. Çıkış: {user.avg_exit_time || '--:--'}</span>
                            </div>
                        </div>
                    ))}

                    {data.length === 0 && (
                        <div className="text-center text-slate-400 py-8">
                            Bu ay için henüz veri bulunmuyor.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
