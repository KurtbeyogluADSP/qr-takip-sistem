# Kurtbeyoğlu ADSP - Personel QR Takip Sistemi

Diş kliniği personel giriş-çıkış takip sistemi.

## Özellikler

### Resepsiyon Kiosk (`/kiosk`)
- Sürekli değişen QR kod (60 saniyede bir yenilenir)
- QR altında görüntülenen "Doğrulama Kodu"
- Sabah giriş, akşam çıkış için okutulur

### Admin Paneli (`/admin`)
- **Giriş:** `admin` / `dtberk123`
- Kullanıcı ekleme/düzenleme/silme ve Kiosk yönetimi
- Çalışan için giriş QR oluşturma
- Aylık çalışma analizleri ve raporlar

### Çalışan Uygulaması (`/assistant`)
- İlk giriş: Admin QR okutarak cihaz bağlama
- Günlük: Resepsiyon QR okutarak giriş/çıkış
- **YENİ:** Kamera çalışmazsa "Sayı ile Giriş" özelliği

## Akış

```
1. Admin kullanıcı oluşturur
2. Admin, çalışan için giriş QR oluşturur
3. Çalışan telefonundan QR okutarak GİRER (tek seferlik)
4. Artık o telefon o çalışana bağlı - başkası kullanamaz
5. Her gün resepsiyondaki QR'ı okutarak giriş/çıkış yapar
6. Kamera sorunu varsa "Kameram Çalışmıyor" diyerek ekrandaki sayıyı seçer
```

## Hata Durumları

| Hata | Çözüm |
|------|-------|
| "Uygulama kapandı" | Berk Hoca'ya gidin, yeni giriş QR alın |
| "QR süresi doldu" | Bekleyin, QR 60 saniyede yenilenir |
| "Kameram Çalışmıyor" | Ekrandaki "Kameram Çalışmıyor" butonuna basın ve Kiosk'taki sayıyı seçin |
| "Geçersiz KOD" | Kiosk ekranındaki sayıyı doğru seçtiğinizden emin olun |

## Kurulum

```bash
npm install
npm run dev
```

## Ortam Değişkenleri (.env)

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Teknolojiler

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (veritabanı)
