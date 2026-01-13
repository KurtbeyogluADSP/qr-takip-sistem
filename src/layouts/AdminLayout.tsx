
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { LogOut, LayoutDashboard, QrCode } from 'lucide-react';

export default function AdminLayout() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-lg font-bold text-blue-900 leading-tight">Özel Kurtbeyoğlu Ağız ve Diş Sağlığı Polikliniği</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left">
                        <QrCode size={20} />
                        <span>Re-entry QR</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}
