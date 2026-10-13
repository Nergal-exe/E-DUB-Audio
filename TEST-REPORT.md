# E-DUB Audio 0.5.1 — Son kontrol

## 0.5.1 kontrolleri (13 Ekim 2026)
- `npm run build` ve `npm run dist:win`: TypeScript, üretim derlemesi ve x64 Setup.
- DSP testi, tarayıcı testleri (smoke, settings, effects, device-regression, device-fallback, stereo) ve paketlenmiş uygulamada native, lifecycle ve monitor-ui testleri geçti.
- Elle doğrulandı: sayı alanlarına negatif/ara değer yazma, birleşik EQ eğrisi ve kırpılma uyarısı, oynatma çubuğu ve sarma, sürükle-bırak, Boşluk kısayolu, mono dosyada iki kanallı ölçüm.

## Geçen kontroller
- TypeScript ve üretim derlemesi.
- Sayısal DSP: limiter tepe sınırı, gate, çok bant birleşimi, mono/merkez bastırma, perde, bit derinliği ve gürültü azaltma.
- Efekt kütüphanesi, işlemcilerin başlatılması, DeepFilterNet ve RNNoise model çalışması, IR/AutoEQ aktarımı, mikrofon/yankı önleme.
- Tema ve profil kalıcılığı, varsayılana dönüş, efekt kaldırma/ekleme, veritabanı içe/dışa aktarma, cihaz kuralları, muafiyetler, atıllık, dar ekran.
- Mikrofon +6 dB kazancı; bağımsız stereo ölçüm: sol −6.02, sağ −26.02 dBFS.
- Gerçek Windows cihaz taraması: 3 giriş, 8 çıkış. Mikrofon izni reddedilince çıkışları listeleme ve mikrofon kaynağını serbest bırakma.
- Windows paketinde dosya oynatma, çevrimdışı AI işlemcileri, sentetik mikrofon, yankı önleme, tepsiye gizleme/geri açma ve gizli başlangıç.
- CPU IPC, başlık kontrolleri ve Hakkında menüsü.

## Setup ve kaldırma
- x64, tüm kullanıcılar için yönetici yetkisiyle Program Files altında E-DUB Audio klasörüne kurulum.
- Kurulum dizini seçim sayfası kapalı. Başlat menüsü ve masaüstü kısayolları açık.
- Gerçek kaldırmada mevcut Windows kullanıcısının uygulama ayarları, kayıtlı profilleri, kuralları, tarayıcı depolaması ve önbelleği temizlenir. Başlangıç kayıtları kaldırılır.
- Güncelleme sırasında kullanıcı verileri korunur.
- Kullanıcının dışa aktardığı JSON yedekleri, kendi ses ve IR dosyaları silinmez. Diğer Windows kullanıcı hesaplarının özel verileri temizlenmez.

## Test sınırları
Gerçek Program Files kurulumu/kaldırması bu bilgisayarda çalıştırılmadı; mevcut kullanıcı verileri silinmedi. NSIS kurulum ve kaldırma kodu incelenip Setup derlemesiyle doğrulandı. Başlangıç kaydı testinde işletim sistemi çağrıları taklit edildi; gerçek oturum açma/yeniden başlatma denenmedi. Her efektin tüm parametre kombinasyonları ve her donanımın akustik kalitesi bu testlerle garanti edilmez. Sistem genelinde ses işleme ve uygulama bazlı muafiyet desteklenmez.
