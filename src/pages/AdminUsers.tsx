import { useState } from 'react';
import { Users, UserPlus, Settings, BarChart3, LayoutDashboard } from 'lucide-react';
import UserListTab from '../components/admin/UserListTab';
import CreateUserTab from '../components/admin/CreateUserTab';
import SettingsTab from '../components/admin/SettingsTab';
import ReportsTab from '../components/admin/ReportsTab';

type Tab = 'list' | 'create' | 'reports' | 'settings';

export default function AdminUsers() {
    const [activeTab, setActiveTab] = useState<Tab>('list');

    const menuItems = [
        { id: 'list', label: 'Personel Listesi', icon: Users },
        { id: 'create', label: 'Yeni Personel Ekle', icon: UserPlus },
        { id: 'reports', label: 'Aylık Rapor', icon: BarChart3 },
        { id: 'settings', label: 'İşletme Ayarları', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutDashboard className="text-blue-600" />
                        Yönetim Paneli
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as Tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="text-xs text-slate-400 text-center">
                        Kurtbeyoğlu ADSP v1.0
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {menuItems.find(m => m.id === activeTab)?.label}
                    </h2>
                </header>

                <main className="p-8">
                    {activeTab === 'list' && <UserListTab />}
                    {activeTab === 'create' && <CreateUserTab onUserCreated={() => setActiveTab('list')} />}
                    {activeTab === 'reports' && <ReportsTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                </main>
            </div>
        </div>
    );
}
