# İkamet İzni Sorgulama Sistemi

Bu uygulama, kimlik numaralarını kullanarak ikamet izni bilgilerini sorgulayan ve sonuçları tablo halinde gösteren bir Next.js uygulamasıdır.

## Özellikler

- ✅ Kimlik numarası listesi girişi (manuel veya dosya yükleme)
- ✅ Tek tek API sorgulaması (rate-limit korumalı)
- ✅ Canlı ilerleme takibi
- ✅ Karmaşık veri işleme kuralları
- ✅ Excel export özelliği
- ✅ Hata yönetimi ve retry mekanizması
- ✅ Türkçe arayüz

## Teknoloji Yığını

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **TailwindCSS** + shadcn/ui
- **SheetJS (xlsx)** - Excel export için

## Kurulum

### Gereksinimler
- Node.js 18 veya üzeri
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın:**
\`\`\`bash
git clone <repo-url>
cd residence-permit-query
\`\`\`

2. **Bağımlılıkları yükleyin:**
\`\`\`bash
npm install
# veya
yarn install
\`\`\`

3. **Geliştirme sunucusunu başlatın:**
\`\`\`bash
npm run dev
# veya
yarn dev
\`\`\`

4. **Tarayıcıda açın:**
\`\`\`
http://localhost:3000
\`\`\`

## Kullanım

### 1. Kimlik Numarası Girişi
- Metin alanına kimlik numaralarını girin (her satıra bir numara)
- Veya CSV/TXT dosyası yükleyin
- Virgül, noktalı virgül veya boşlukla ayırabilirsiniz

### 2. Sorgu Ayarları
- **Gecikme (ms):** İstekler arası bekleme süresi (varsayılan: 300ms)
- **Eşzamanlılık:** Aynı anda gönderilecek istek sayısı (varsayılan: 1, max: 3)

### 3. Sorgulamayı Başlatma
- "Sorgulamayı Başlat" butonuna tıklayın
- İlerleme durumunu takip edin
- Gerekirse duraklat/durdur butonlarını kullanın

### 4. Sonuçları İnceleme
- Tablo halinde sonuçları görün
- Sağ panelde istek loglarını takip edin
- "Excel Olarak İndir" ile sonuçları dışa aktarın

## Veri İşleme Kuralları

Uygulama, API'den gelen verileri şu kurallara göre işler:

### Gerekçe Belirleme (Öncelik Sırası)
1. **Aile İzni:** `aileDestekleyiciTur` alanı kontrol edilir
2. **Kısa Dönem:** `kisaDonemKalisNeden` + "(Kısa Dönem)"
3. **Öğrenci:** `ogrenciKalisNeden` + "(Öğrenci)"
4. **İnsani:** `insaniIkametIzniKalisNeden` + "(İnsani)"
5. **Uzun Dönem:** `turkSoylu` + "(Uzun Dönem)"
6. **Varsayılan:** "Veri Yok"

### Tarih İşleme
- En yeni kayıt `bitisTarihi`'ne göre seçilir
- Tarihler Europe/Istanbul saat dilimine göre formatlanır
- Geçersiz tarihler "Veri Yok" olarak gösterilir

## Test

\`\`\`bash
npm test
# veya
yarn test
\`\`\`

Test dosyaları `__tests__` klasöründe bulunur.



## Hata Yönetimi

- **API Hataları:** Otomatik retry (1 kez)
- **Rate Limiting:** 429 durumunda otomatik bekleme
- **Timeout:** Ağ zaman aşımı koruması
- **Malformed Data:** Geçersiz JSON yanıtları için fallback

## Performans

- Varsayılan olarak tek tek istek gönderilir (rate-limit uyumlu)
- Kullanıcı tanımlı gecikme süresi
- Maksimum 3 eşzamanlı istek
- Büyük veri setleri için optimize edilmiş tablo görünümü

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
