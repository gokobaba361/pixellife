# Faz 0 / Gün 6 - Teknik ve Üretim

## Amaç

Bugünün amacı Pixel Life için teknik üretim yönünü belirlemektir. Bu belge
nihai implementasyon dokümanı değildir; hangi teknolojiyle hangi riski ne zaman
test edeceğimizi netleştirir.

Teknik karar ilkesi:

> En güçlü teknolojiyi değil, ilk 12 ayda ürün riskini en hızlı azaltacak
> teknolojiyi seç.

## Üretim Önceliği

Pixel Life'ın ilk büyük riski teknoloji değil, tasarım ve içerik tutarlılığıdır.
Bu nedenle teknik yapı şu üç hedefe hizmet etmelidir:

- İçerik eklemek kolay olmalı.
- Meslek/NPC/görev ayrışması veriyle yönetilebilmeli.
- Web prototipten mobil MVP'ye geçiş mümkün olmalı.

## Motor Seçimi

### Aday 1: Phaser

Güçlü yanları:

- Web prototipi hızlı geliştirme.
- TypeScript ile veri odaklı yapı kurma.
- 2D pixel-art oyunlar için yeterli.
- Tarayıcıda hızlı test ve paylaşım.
- Küçük ekip için düşük operasyon yükü.

Zayıf yanları:

- Native mobil yayın için ek paketleme süreci gerekir.
- Büyük ölçekli araç ekosistemi Unity kadar geniş değildir.
- Görsel editör ve sahne araçları sınırlıdır.

Uygun olduğu durum:

- İlk 6-12 ay web prototip ve mobil MVP doğrulaması.
- Veri odaklı şehir, görev, NPC ve meslek sistemleri.
- Küçük ekip ve hızlı iterasyon.

### Aday 2: Unity

Güçlü yanları:

- Mobil yayın ve mağaza süreçlerinde güçlü ekosistem.
- Görsel araçlar ve asset pipeline daha olgun.
- Uzun vadede animasyon, UI, mobil performans ve ekip büyümesi için avantajlı.

Zayıf yanları:

- Başlangıç üretim hızı daha ağır olabilir.
- Kod ajanı ve web tabanlı hızlı iterasyon akışı daha yavaşlayabilir.
- Küçük prototiplerde proje karmaşıklığı artabilir.

Uygun olduğu durum:

- Mobil MVP için güçlü native hedef ve daha büyük ekip.
- Daha gelişmiş animasyon/asset pipeline ihtiyacı.
- Uzun vadeli mağaza üretimi kesinleştiğinde.

### Geçici Motor Kararı

Faz 0 kararı:

> İlk üretim hattı Phaser + TypeScript ile devam eder.

Gerekçe:

- Mevcut prototip zaten Phaser üzerinde.
- GDD ve içerik tabloları hızlıca oyuna bağlanabilir.
- Web üzerinde test yapmak kolaydır.
- Oyunun ilk riski teknik performans değil, sistem ve içerik farklılaşmasıdır.

Unity kapısı kapanmaz. Mobil MVP'den önce şu koşullarda yeniden değerlendirilir:

- Phaser paketleme veya performans sorunu yaşanırsa.
- UI/animasyon üretimi Phaser'da çok pahalı hale gelirse.
- Ekipte güçlü Unity üretim kapasitesi oluşursa.

## Platform Planı

### Aşama 1: Web Prototip

Amaç:

- GDD kararlarını oynanabilir hale getirmek.
- İlk 10 dakika deneyimini test etmek.
- Meslek/NPC/görev ayrışmasını kanıtlamak.

Platform:

- Web.
- Masaüstü tarayıcı.
- Mobil tarayıcı uyumluluğu erken kontrol edilir ama ilk hedef değildir.

### Aşama 2: Mobil MVP

Amaç:

- Android üzerinde kapalı test.
- Dokunmatik UI ve 5 dakikalık oturum doğrulaması.
- Kayıt, ekonomi ve günlük görevlerin gerçek kullanımı.

Platform:

- Android önce.
- iOS sonra.

### Aşama 3: Store ve Steam Değerlendirmesi

Amaç:

- Mobil store çıkışı.
- Steam uygunluğu için UI, pencereleme ve içerik değerlendirmesi.

Steam, mobil ana ürün doğrulanmadan ana hedef yapılmaz.

## Backend Yaklaşımı

### MVP Backend İhtiyaçları

MVP için gerekenler:

- Kullanıcı hesabı.
- Oyuncu profili.
- Kayıtlı ilerleme.
- Görev durumları.
- NPC ilişki durumları.
- Envanter ve dekor.
- Ekonomi kayıtları.
- İçerik konfigürasyonu.

MVP için gerekmeyenler:

- Büyük ölçekli MMO sunucusu.
- Gerçek zamanlı açık dünya.
- Karmaşık ticaret sistemi.
- Oyuncular arası ekonomi.

### Önerilen Başlangıç

Faz 0 teknik yön:

> Supabase benzeri yönetilen backend ile başla; özel backend'i ihtiyaç doğunca
> ekle.

Gerekçe:

- Auth, veritabanı ve basit depolama hızlı kurulur.
- Küçük ekip için operasyon yükü düşer.
- İçerik ve oyuncu verisi ilişkisel olarak modellenebilir.
- MVP için yeterli esneklik sağlar.

Özel backend ne zaman gerekir?

- Multiplayer gerçek zamanlı oturumlar kritik hale gelirse.
- Karmaşık anti-cheat veya ekonomi doğrulaması gerekirse.
- Sunucu tarafı görev/ödül hesaplama büyürse.
- Çok yüksek kullanıcı ölçeği ve özel optimizasyon ihtiyacı doğarsa.

## Veri Modeli İlkeleri

Pixel Life içerik ağırlıklı bir oyun olduğu için veri modeli tasarımın
omurgasıdır.

İçerik verileri kodun içine gömülmemelidir. Şu varlıklar veri tablosu veya JSON
olarak yönetilmelidir:

- Lokasyonlar.
- NPC'ler.
- Meslekler.
- Görevler.
- Diyaloglar.
- Ödüller.
- Dekorlar.
- Kıyafetler.
- Şehir itibarı etiketleri.

Oyuncu verileri:

- Profil.
- Karakter görünümü.
- Başlangıç eğilimi.
- Aktif meslek.
- Meslek seviyeleri.
- NPC ilişkileri.
- Görev ilerlemeleri.
- Envanter.
- Ev düzeni.
- Coin.
- Açık lokasyonlar.
- Şehir itibarı etiketleri.

## İçerik Formatı

Başlangıç için önerilen format:

- Tasarım aşaması: Markdown + CSV/Google Sheets uyumlu tablolar.
- Oyun prototipi: JSON içerik dosyaları.
- Backend aşaması: veritabanı tabloları ve versiyonlanmış içerik paketleri.

Örnek görev şeması:

```json
{
  "id": "quest_cafe_first_shift",
  "title": "İlk Vardiya",
  "locationId": "cafe",
  "npcId": "ece",
  "professionTags": ["barista"],
  "requiredFlags": ["intro_completed"],
  "rewards": { "coin": 60, "relationship:ece": 1 },
  "cityReputation": ["caliskan"],
  "nextQuestIds": ["quest_cafe_remembers_you"]
}
```

Bu örnek nihai şema değildir; amaç, içeriklerin kod değişmeden eklenebilmesini
sağlamaktır.

## Multiplayer Teknik Sınırı

MVP için multiplayer ana üretim riski yapılmaz.

İlk teknik hedef:

- 2 kişilik lobby prototipi.
- Davet kodu veya arkadaş daveti.
- Aynı etkinliğe katılma.
- Basit ortak sonuç ekranı.

Gerçek zamanlı açık dünya, MMO, şehirde herkesin aynı anda görünmesi veya büyük
oda sistemi MVP dışıdır.

Multiplayer risk testi şu sorulara cevap vermelidir:

- 2 kişi aynı etkinlikte anlamlı eğleniyor mu?
- Sosyal deneyim ana tek oyunculu döngüyü bozuyor mu?
- Teknik maliyet getirdiği değere değiyor mu?

## Üretim Pipeline

Önerilen üretim klasör mantığı:

```text
docs/
  GDD ve karar belgeleri

src/
  oyun kodu

src/content/
  JSON içerik paketleri

assets/
  pixel-art kaynakları

tools/
  içerik doğrulama ve dönüştürme scriptleri
```

İçerik üretim akışı:

1. GDD'de karar yazılır.
2. İçerik tabloya girilir.
3. JSON içerik paketine dönüştürülür.
4. Oyun içinde doğrulanır.
5. Playtest sonucu GDD ve veri güncellenir.

## Kod Ajanı İçin Üretim Kuralları

GDD sonrasında kod ajanı şu kurallara uymalıdır:

- GDD'de olmayan büyük sistemi ekleme.
- Önce veri modeli, sonra UI ve oynanış bağla.
- Her yeni sistem için örnek içerik üret.
- İçerik kod içine sabitlenmesin.
- İlk 10 dakika deneyimini bozan UI ekleme.
- Mobil dokunmatik hedefleri erken düşün.
- NPC ve görev sistemi mesleğe göre dallanabilsin.

## Kalite ve Test Yaklaşımı

MVP test başlıkları:

- İlk 10 dakika akışı.
- Görev açılma koşulları.
- NPC meslek tepkileri.
- Kayıt/yükleme.
- Mobil boyutlarda UI.
- 5 dakikalık günlük oturum.
- Ekonomi ödül/harcama dengesi.

Teknik test başlıkları:

- İçerik JSON doğrulama.
- Görev zinciri bütünlüğü.
- Eksik NPC/lokasyon referansları.
- Kaydetme verisi migration kontrolü.
- Mobil performans.

## Üretim Fazları

### Teknik Faz A - İçerik Altyapısı

- `src/content` yapısı.
- Lokasyon/NPC/meslek/görev JSON şemaları.
- Basit içerik doğrulama scripti.
- GDD'deki ilk içeriklerin oyuna bağlanması.

### Teknik Faz B - İlk 10 Dakika

- Karakter başlangıcı.
- Başlangıç eğilimi.
- İlk lokasyon.
- İlk NPC tepkisi.
- İlk görev zinciri.

### Teknik Faz C - Meslek Ayrışması

- İlk 5 meslek.
- Meslek seviyeleri.
- Mesleğe özel görev ve NPC tepkileri.

### Teknik Faz D - Kayıt ve Backend

- Lokal kayıt.
- Backend hesap ve cloud save.
- Oyuncu profili.

### Teknik Faz E - Mobil Hazırlık

- Dokunmatik UI.
- Android paketleme denemesi.
- Performans ve ekran oranı kontrolleri.

## Gün 6 Kararları

Bugün kilitlenen geçici kararlar:

- İlk üretim hattı Phaser + TypeScript ile devam edecek.
- Unity kapısı mobil MVP öncesi yeniden değerlendirilecek.
- Backend başlangıcı yönetilen servis yaklaşımıyla yapılacak; Supabase benzeri
  bir çözüm ilk adaydır.
- İçerikler kod içine gömülmeyecek; JSON/tablo temelli veri akışı kurulacak.
- Multiplayer MVP'nin ana riski yapılmayacak; 2 kişilik lobby ayrı risk testi
  olarak ele alınacak.
- İlk teknik faz, içerik altyapısı ve ilk 10 dakika deneyimi olacak.

Henüz kilitlenmeyen kararlar:

- Kesin backend sağlayıcısı.
- Mobil paketleme yöntemi.
- İçerik editörü Google Sheets mi özel panel mi olacak?
- Unity geçiş eşiği.
- Multiplayer prototip tarihi.

## Gün 7'ye Taşınan Sorular

- Faz 0 sonunda MVP kapsamı nasıl tek sayfada kilitlenecek?
- En büyük 10 risk nedir?
- 12 haftalık üretim planı nasıl bölünmeli?
- Hangi kararlar artık değişmemeli?
- İlk üretim sprintinde ne yapılacak?
