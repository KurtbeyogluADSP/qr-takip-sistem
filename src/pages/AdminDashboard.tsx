import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeCheckins: 0,
        totalAssistants: 0,
        todaysTasks: 0
    });

    useEffect(() => {
        // Mock fetch for stats or real if DB connected
        const fetchStats = async () => {
            // Placeholder logic
            setStats({
                activeCheckins: 3,
                totalAssistants: 4,
                todaysTasks: 12
            });
        };
        fetchStats();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Clinic Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Active Check-ins</div>
                    <div className="text-3xl font-bold text-green-600">{stats.activeCheckins}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Total Assistants</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.totalAssistants}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Tasks Today</div>
                    <div className="text-3xl font-bold text-purple-600">{stats.todaysTasks}</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <a href="/admin/re-entry" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm">
                        Generate Re-entry QR
                    </a>
                </div>
            </div>
        </div>
    );
}
