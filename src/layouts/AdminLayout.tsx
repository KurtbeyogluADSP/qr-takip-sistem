
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { LogOut, LayoutDashboard, QrCode, UserPlus, BarChart2 } from 'lucide-react';

export default function AdminLayout() {
    const { logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    // Admin değilse login'e yönlendir
    if (!isAdmin) {
        navigate('/login');
        return null;
    }

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-lg font-bold text-blue-900 leading-tight">Özel Kurtbeyoğlu Ağız ve Diş Sağlığı Polikliniği</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/re-entry" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left">
                        <QrCode size={20} />
                        <span>Re-entry QR</span>
                    </Link>
                    <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left">
                        <UserPlus size={20} />
                        <span>Kullanıcı Yönetimi</span>
                    </Link>
                    <Link to="/admin/analytics" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left">
                        <BarChart2 size={20} />
                        <span>Raporlar</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 w-full text-left">
                        <LogOut size={18} />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 md:ml-64 mb-16 md:mb-0 max-w-md mx-auto md:max-w-full w-full">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 shadow-lg pb-safe">
                <Link to="/admin" className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600">
                    <LayoutDashboard size={20} />
                    <span className="text-xs mt-1">Dash</span>
                </Link>
                <Link to="/admin/re-entry" className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600">
                    <QrCode size={20} />
                    <span className="text-xs mt-1">QR</span>
                </Link>
                <Link to="/admin/users" className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600">
                    <UserPlus size={20} />
                    <span className="text-xs mt-1">Kişiler</span>
                </Link>
                <Link to="/admin/analytics" className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600">
                    <BarChart2 size={20} />
                    <span className="text-xs mt-1">Rapor</span>
                </Link>
                <button onClick={handleSignOut} className="flex flex-col items-center p-2 text-red-500 hover:text-red-700">
                    <LogOut size={20} />
                    <span className="text-xs mt-1">Çıkış</span>
                </button>
            </nav>
        </div>
    );
}
