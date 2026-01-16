
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, LogOut, User } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import clsx from 'clsx';

export default function AssistantLayout() {
    const { pathname } = useLocation();
    const { clearSelectedUser, selectedUserName, isLoading } = useAuth();
    const navigate = useNavigate();

    // Kullanıcı seçilmemişse login'e yönlendir
    if (!isLoading && !selectedUserName) {
        navigate('/login');
        return null;
    }

    const handleSignOut = () => {
        clearSelectedUser();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    <h1 className="font-bold text-lg text-blue-900">{selectedUserName || 'Çalışan'}</h1>
                </div>
                <button onClick={handleSignOut} className="text-gray-500 hover:text-red-600">
                    <LogOut size={20} />
                </button>
            </header>

            {/* Content */}
            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-4 py-3 z-30 pb-safe">
                <Link
                    to="/assistant/scan"
                    className={clsx(
                        "flex flex-col items-center gap-1 text-xs font-medium",
                        pathname.includes('scan') ? "text-blue-600" : "text-gray-400"
                    )}
                >
                    <QrCode size={24} />
                    <span>Yoklama</span>
                </Link>
            </nav>
        </div>
    );
}
