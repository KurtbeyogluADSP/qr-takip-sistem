import { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSetting, type SystemSettings } from '../../lib/settings';
import { Save, MapPin, Clock, DollarSign, LocateFixed } from 'lucide-react';

export default function SettingsTab() {
    const [settings, setSettings] = useState<SystemSettings>({
        work_start_time: '09:00',
        work_end_time: '18:00',
        hourly_wage: '100',
        clinic_location_lat: '',
        clinic_location_lng: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await getSystemSettings();
        setSettings(prev => ({ ...prev, ...data }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateSystemSetting('work_start_time', settings.work_start_time);
            await updateSystemSetting('work_end_time', settings.work_end_time);
            await updateSystemSetting('hourly_wage', settings.hourly_wage);
            await updateSystemSetting('clinic_location_lat', settings.clinic_location_lat);
            await updateSystemSetting('clinic_location_lng', settings.clinic_location_lng);
            setMsg('Ayarlar başarıyla kaydedildi.');
            setTimeout(() => setMsg(''), 3000);
        } catch {
            setMsg('Hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum servisini desteklemiyor.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings(prev => ({
                    ...prev,
                    clinic_location_lat: position.coords.latitude.toString(),
                    clinic_location_lng: position.coords.longitude.toString()
                }));
            },
            (error) => {
                alert('Konum alınamadı: ' + error.message);
            }
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Clock className="text-orange-500" />
                    Mesai Saatleri
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Başlangıç Saati</label>
                        <input
                            type="time"
                            value={settings.work_start_time}
                            onChange={e => setSettings({ ...settings, work_start_time: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Bitiş Saati</label>
                        <input
                            type="time"
                            value={settings.work_end_time}
                            onChange={e => setSettings({ ...settings, work_end_time: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Bu saatler geç kalma ve fazla mesai hesaplamalarında kullanılacaktır.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <DollarSign className="text-green-500" />
                    Ücretlendirme
                </h3>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Saatlik Ücret (TL)</label>
                    <input
                        type="number"
                        value={settings.hourly_wage}
                        onChange={e => setSettings({ ...settings, hourly_wage: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Örn: 120"
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <MapPin className="text-blue-500" />
                    Klinik Konumu (GPS)
                </h3>

                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Enlem (Latitude)</label>
                        <input
                            type="text"
                            value={settings.clinic_location_lat}
                            readOnly
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Boylam (Longitude)</label>
                        <input
                            type="text"
                            value={settings.clinic_location_lng}
                            readOnly
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                        />
                    </div>
                </div>

                <button
                    onClick={handleGetLocation}
                    className="w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                    <LocateFixed size={18} />
                    Şu Anki Konumu Al ve Kaydet
                </button>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Save size={18} />}
                    Ayarları Kaydet
                </button>
            </div>

            {msg && (
                <div className="text-center p-3 bg-green-100 text-green-700 rounded-lg animate-fade-in">
                    {msg}
                </div>
            )}
        </div>
    );
}
