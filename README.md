# Kurtbeyoğlu ADSP - QR Takip Sistemi

Personel giriş-çıkış takibi ve Kiosk yönetimi için geliştirilmiş modern web uygulaması.

## Özellikler

- **QR ile Temassız Giriş/Çıkış:** Personel kişisel QR kodunu okutarak işlem yapar.
- **Kiosk Modu:** Tablet veya PC'de sürekli açık duran QR okuma ekranı.
- **Admin Paneli:** Kullanıcı yönetimi, geçmiş takibi ve "Günü Kapatma" özelliği.
- **Güvenlik (Strict Re-entry):** Uygulamadan çıkış yapan personel kilitlenir, sadece Admin açabilir.
- **Puan Sistemi:** (Opsiyonel/Gizli) Görev puanlama altyapısı mevcuttur.

## Hızlı Başlangıç

### Kiosk Ekranını Açma (Banko/Giriş)
1. Tarayıcıda `https://[uygulama-adresi]/kiosk` adresine gidin.
2. Sayfa açılınca tam ekran yapın (F11).
3. Günlük QR otomatik olarak ekranda belirecektir.

### Admin Girişi
- `/login` adresinden yönetici hesabı ile giriş yapın.

## Teknik Bilgiler
- **Framework:** React + Vite
- **Veritabanı:** Supabase
- **Styling:** TailwindCSS

## Kurulum (Geliştirici)
```bash
npm install
npm run dev
```
