
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, LogOut, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import clsx from 'clsx';

export default function AssistantLayout() {
    const { pathname } = useLocation();
    const { clearSelectedUser, selectedUserName, selectedUserId, isLoading } = useAuth();
    const navigate = useNavigate();

    // Kullanıcı seçilmemişse hata göster ve login'e yönlendir
    if (!isLoading && !selectedUserId) {
        return (
            <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                    <div className="bg-red-100 p-4 rounded-full inline-flex mb-6">
                        <AlertTriangle size={48} className="text-red-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-red-700 mb-4">Oturum Bulunamadı</h1>
                    <p className="text-slate-500 mb-6">
                        Uygulamadan çıkış yapılmış. Devam etmek için <strong>Berk Hoca'ya</strong> gidin ve yeni giriş QR alın.
                    </p>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                    >
                        Giriş Sayfasına Git
                    </button>
                </div>
            </div>
        );
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
