# Üçüncü taraf bileşenler

E-DUB Audio kaynak kodunun lisansı LICENSE.txt içindedir. Aşağıdaki bileşenlerin kendi lisansları korunur; projenin lisans bildirimi bunların yerine geçmez.

- Electron / Chromium: dağıtım içinde LICENSE.electron.txt ve LICENSES.chromium.html.
- DeepFilterNet: @lofcz/deepfilternet-web 0.1.0, MIT / Apache-2.0. Kaynak: https://github.com/lofcz/DeepFilterNet — paket içindeki LICENSE-MIT ve LICENSE-APACHE metinleri derlemede public/vendor içine kopyalanır.
- RNNoise: @shiguredo/rnnoise-wasm 2025.1.5, Apache-2.0 sarmalayıcı ve BSD-3-Clause RNNoise. Kaynak: https://github.com/shiguredo/rnnoise-wasm — paket lisansı derlemede public/vendor içine kopyalanır.
- Diğer JavaScript bağımlılıkları ve kesin sürümleri package-lock.json içinde listelenir. İlgili paketlerin lisans metinleri kendi paketlerinde yer alır.

WASM ve model dosyaları npm ci ve npm run build ile sabitlenmiş bağımlılıklardan hazırlanır. scripts/vendor.mjs, DeepFilterNet worklet değişikliklerini yeniden üretir. public/vendor üretilen çıktı olduğundan Git deposuna eklenmez.
