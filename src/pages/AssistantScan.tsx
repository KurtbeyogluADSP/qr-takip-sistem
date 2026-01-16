import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function AssistantScan() {
    const { selectedUserId, selectedUserName } = useAuth();
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        details?: string;
    } | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (isScanning) {
            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, [isScanning]);

    const onScanSuccess = async (decodedText: string) => {
        setIsScanning(false);

        try {
            await processScan(decodedText);
        } catch (error: any) {
            setScanResult({
                success: false,
                message: 'QR İşleme Hatası',
                details: error.message
            });
        }
    };

    const onScanFailure = (_error: any) => {
        // Ignore frame failures
    };

    const processScan = async (token: string) => {
        const parts = token.split(':');
        const tokenType = parts[0];

        if (tokenType !== 'kiosk' && tokenType !== 're_entry') {
            throw new Error("Geçersiz QR Kod Formatı");
        }

        let type = '';
        let timestamp = 0;

        if (tokenType === 'kiosk') {
            type = parts[1];
            timestamp = parseInt(parts[2], 10);

            const now = Date.now();
            if (now - timestamp > 50000) {
                throw new Error("QR Kod süresi doldu. Lütfen yenilenmesini bekleyin.");
            }
        } else if (tokenType === 're_entry') {
            type = 'check_in';
            timestamp = parseInt(parts[1], 10);

            if (Date.now() - timestamp > 300000) {
                throw new Error("Tekrar Giriş QR süresi doldu.");
            }
        }

        // Fingerprint
        const fp = await fpPromise.load();
        const result = await fp.get();
        const deviceId = result.visitorId;

        // Anti-Fraud Check
        if (type === 'check_in' && tokenType === 'kiosk') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const { data: existing } = await supabase
                .from('attendance')
                .select('id')
                .eq('device_id', deviceId)
                .eq('type', 'check_in')
                .gte('timestamp', startOfDay.toISOString());

            if (existing && existing.length > 0) {
                throw new Error("Uyarı: Bu cihaz bugün zaten giriş yapmış!");
            }
        }

        // Submit to Supabase
        const { error } = await supabase
            .from('attendance')
            .insert({
                user_id: selectedUserId,
                type: type,
                timestamp: new Date().toISOString(),
                device_id: deviceId,
                qr_token: token,
                status: tokenType === 're_entry' ? 'approved_reentry' : 'approved'
            });

        if (error) {
            throw new Error(error.message);
        }

        setScanResult({
            success: true,
            message: `${type === 'check_in' ? 'Giriş' : 'Çıkış'} Başarılı!`,
            details: `Kullanıcı: ${selectedUserName}`
        });
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <div className="flex flex-col items-center p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Kiosk QR Okut</h2>

            {!scanResult ? (
                <div className="w-full bg-white rounded-xl shadow-lg p-4 overflow-hidden">
                    <div id="reader" className="w-full"></div>
                    <p className="text-center text-sm text-gray-500 mt-4">Resepsiyon ekranına tutun</p>
                </div>
            ) : (
                <div className={`w-full p-6 rounded-xl shadow-lg text-center ${scanResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="text-5xl mb-4">{scanResult.success ? '✅' : '❌'}</div>
                    <h3 className="text-xl font-bold mb-2">{scanResult.message}</h3>
                    <p className="text-sm opacity-80 break-all">{scanResult.details}</p>

                    <button
                        onClick={resetScanner}
                        className="mt-6 w-full bg-white border border-gray-200 py-3 rounded-lg font-semibold shadow-sm text-gray-700 hover:bg-gray-50"
                    >
                        Tekrar Okut
                    </button>
                </div>
            )}
        </div>
    );
}
