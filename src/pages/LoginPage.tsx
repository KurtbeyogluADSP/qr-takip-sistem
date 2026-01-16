import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const success = login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Kullanıcı adı veya şifre hatalı');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10 backdrop-blur-sm bg-white/90">
                <div className="text-center flex flex-col items-center">
                    <img src="/logo.jpg" alt="Kurtbeyoğlu Logo" className="w-32 h-32 object-contain mb-6 drop-shadow-md" />

                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Kurtbeyoğlu ADSP
                    </h2>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-1 mb-8">
                        Personel QR Takip Sistemi
                    </p>

                    <p className="text-sm text-gray-600">
                        Admin Girişi
                    </p>
                </div>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                placeholder="Kullanıcı Adı"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 font-medium animate-pulse">{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
                        >
                            <Lock size={18} />
                            {isLoading ? 'İşleniyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-6 text-center text-gray-400 text-xs">
                &copy; 2024 Kurtbeyoğlu ADSP. Tüm hakları saklıdır.
            </div>
        </div>
    );
}
