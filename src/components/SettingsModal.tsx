import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentWage: string;
    onUpdate: () => void;
}

export default function SettingsModal({ isOpen, onClose, currentWage, onUpdate }: SettingsModalProps) {
    const [wage, setWage] = useState(currentWage);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setWage(currentWage);
    }, [currentWage]);

    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            // Upsert the hourly_wage setting
            const { error } = await supabase
                .from('system_settings')
                .upsert({ key: 'hourly_wage', value: wage });

            if (error) throw error;

            onUpdate(); // Refresh parent
            onClose();
        } catch (err: any) {
            console.error('Error saving settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    ⚙️ Sistem Ayarları
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Saatlik Asgari Ücret (TL)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={wage}
                                onChange={(e) => setWage(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-lg"
                                placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                ₺
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Bu değer, personel analizlerindeki "Tahmini Hak Ediş" hesaplamasında kullanılır.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Kaydediliyor...' : (
                                <>
                                    <Save size={18} />
                                    Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
