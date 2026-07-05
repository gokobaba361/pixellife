# Faz 0 / Gün 4 - Sistemler

## Amaç

Bugünün amacı Pixel Life'ın ana sistemlerini önceliklendirmek ve MVP kapsamını
kontrol altında tutmaktır. Oyun uzun vadede büyük olabilir; MVP ise tek bir
temel vaadi kanıtlamalıdır:

> Oyuncunun seçtiği yaşam yolu şehir, NPC'ler ve görevler tarafından fark edilir.

Bu nedenle sistem önceliği "çok sistem" değil, "birbirini besleyen az sayıda
net sistem" üzerine kurulmalıdır.

## MVP Sistem Omurgası

MVP'nin ana omurgası:

1. Meslek sistemi.
2. NPC tepki ve ilişki sistemi.
3. Şehir/lokasyon hafızası.

Destek sistemleri:

4. Karakter özelleştirme.
5. Basit ev sistemi.
6. Basit ekonomi.
7. Günlük görev ve ilerleme sistemi.

MVP'de kanıtlanacak ana deneyim:

> İki oyuncu farklı başlangıç eğilimi veya meslek seçtiğinde, şehirde farklı
> görevler, farklı NPC tepkileri ve farklı ilerleme hedefleri görür.

## Sistem Öncelik Tablosu

| Sistem | MVP Rolü | Derinlik | Risk |
| --- | --- | --- | --- |
| Meslek | Ana farklılaşma motoru | Orta | İçerik yükü |
| NPC | Şehrin oyuncuyu tanımasını sağlar | Orta | Yazım/çeşitlilik yükü |
| Şehir Hafızası | Seçimlerin görünür sonucu | Orta | Veri tasarımı |
| Karakter | Kimlik ve sahiplenme | Hafif | Kozmetik kapsam büyümesi |
| Ev | Uzun vadeli sahiplenme | Hafif | Dekorasyon kapsamı |
| Ekonomi | Seçim ve ödül dengesi | Hafif | Grind veya ödeme baskısı |
| Multiplayer | Sosyal genişleme | MVP'de opsiyonel | Teknik risk |

## 1. Karakter Sistemi

### MVP Amacı

Karakter sistemi oyuncuya "bu benim karakterim" hissini hızlı vermelidir.
İlk sürümde derin avatar editörü değil, hızlı ve okunaklı kimlik kurulumu
hedeflenir.

### MVP Kapsamı

Başlangıçta seçilecek alanlar:

- İsim.
- Ten tonu.
- Saç modeli.
- Saç rengi.
- Üst kıyafet.
- Alt kıyafet.
- Başlangıç eğilimi.

MVP dışı:

- Detaylı yüz editörü.
- Boy/kilo sistemi.
- Çok katmanlı aksesuar sistemi.
- Yaşlanmaya göre sprite dönüşümü.

### Başlangıç Eğilimleri

Başlangıç eğilimi meslek kilidi değildir. İlk görev ve NPC tepkisi tonunu
belirler.

Önerilen üç eğilim:

1. Sosyal.
2. Üretken.
3. Yaratıcı.

Etkileri:

- Sosyal: Park, NPC tanışma ve ilişki görevleri öne çıkar.
- Üretken: Kafe, iş ve para kazanma görevleri öne çıkar.
- Yaratıcı: Fotoğraf, müzik, tasarım ve paylaşım görevleri öne çıkar.

### Karakter Sistemi Kararı

MVP'de karakter sistemi kimlik kurmak için yeterli olacak, ama üretimi
yavaşlatacak kadar derin olmayacak.

## 2. Meslek Sistemi

### MVP Amacı

Meslek sistemi oyunun tekrar oynanabilirlik motorudur. Oyuncunun mesleği,
görevleri, NPC tepkilerini, gelir kaynaklarını ve şehirdeki itibarını etkiler.

### İlk 5 Meslek

MVP için önerilen ilk 5 meslek:

1. Barista.
2. Yazılımcı.
3. Fotoğrafçı.
4. Doktor.
5. İç Mimar.

Seçim gerekçesi:

- Barista: Kafe üzerinden erken para ve sosyal sistemleri öğretir.
- Yazılımcı: İş Merkezi ve Üniversite üzerinden kariyer ilerlemesini gösterir.
- Fotoğrafçı: Park, Merkez Meydan ve sosyal paylaşım motivasyonunu besler.
- Doktor: Hastane ve şehir olayları üzerinden daha ciddi görevler açar.
- İç Mimar: Ev Bölgesi ve AVM üzerinden ev/dekorasyon sistemini taşır.

Yedek meslekler:

- Öğretmen.
- Müzisyen.
- Aşçı.
- Veteriner.
- Polis.

### Meslek Seviyeleri

Her meslek MVP'de 5 kariyer seviyesine sahip olur.

Örnek yapı:

1. Çırak.
2. Asistan.
3. Uzman.
4. Tanınan Profesyonel.
5. Şehir Uzmanı.

Her seviye şunları açabilir:

- Yeni görev tipi.
- Yeni NPC tepkisi.
- Yeni gelir aralığı.
- Yeni kıyafet veya dekor ödülü.
- Yeni lokasyon etkileşimi.

### Meslek Mini Oyunları

MVP'de her meslek için tam kapsamlı mini oyun yapılmaz. İlk hedef, mesleğin
farklı hissettirmesidir.

Önerilen mini oyun yönleri:

- Barista: sipariş eşleştirme.
- Yazılımcı: hata ayıklama / mantık akışı eşleştirme.
- Fotoğrafçı: kadraj ve zamanlama.
- Doktor: teşhis ve doğru malzeme seçimi.
- İç Mimar: oda düzeni ve uyum puanı.

### Meslek Sistemi Kararı

MVP'nin ana sistem ağırlığı meslek sistemi olacaktır. İlk 5 meslek, farklı
oyuncu fantezilerini ve farklı şehir lokasyonlarını temsil edecek şekilde
seçildi.

## 3. NPC Sistemi

### MVP Amacı

NPC sistemi, oyunun "şehir seni tanısın" vaadini oyuncuya hissettiren ana
araçtır.

MVP'de NPC'ler tam simülasyon karakterleri olmayacak; ama oyuncu seçimlerini
hatırlayan, mesleğe göre tepki veren ve günlük hedefleri etkileyen karakterler
olacak.

### MVP NPC Sayısı

MVP hedefi:

- 10 ana NPC.
- 5 yardımcı/arka plan NPC.

10 ana NPC'nin her biri şu alanlara sahip olur:

- Ad.
- Lokasyon.
- İş veya rol.
- Kişilik.
- Oyuncuya ilk tepkisi.
- Mesleklere göre özel tepkiler.
- 3 ilişki seviyesi.
- 1 kişisel görev zinciri.

### İlişki Seviyeleri

MVP'de ilişki 3 ana seviyede tutulur:

1. Tanıdık.
2. Arkadaş.
3. Yakın.

Tam sürümde romantik ilişki, aile, ortak yaşam ve özel hikaye seviyeleri
eklenebilir.

### NPC Hafızası

NPC'ler MVP'de şu olayları hatırlamalıdır:

- Oyuncunun başlangıç eğilimi.
- Oyuncunun aktif mesleği.
- Oyuncunun o NPC ile konuşma sayısı.
- Oyuncunun tamamladığı ilgili görevler.
- Oyuncunun şehir itibarı yönü.

Örnek:

- Oyuncu Fotoğrafçı ise Lina yeni kadraj görevleri verir.
- Oyuncu Barista ise Ece kafe vardiyalarından bahseder.
- Oyuncu Doktor ise Hastane NPC'leri daha saygılı veya yardım odaklı konuşur.

### NPC Sistemi Kararı

MVP'de NPC sistemi derin simülasyon yerine güçlü tepki ve hafıza hissine
odaklanacak.

## 4. Ev Sistemi

### MVP Amacı

Ev sistemi oyuncuya uzun vadeli sahiplenme verir. Ancak MVP'de ana sistem
olmamalıdır; meslek ve şehir hafızasını desteklemelidir.

### MVP Kapsamı

MVP'de tek ev tipi:

- Küçük Ev.

Alanlar:

- Ana oda.
- Yatak alanı.
- Çalışma köşesi.
- Dekor alanı.

MVP mekanikleri:

- Dinlenerek enerji yenileme.
- 8-12 temel dekor.
- Mesleğe göre küçük oda bonusları.
- Arkadaş daveti için hazırlık.

MVP dışı:

- Çok katlı evler.
- Garaj.
- Bahçe.
- Gelişmiş pet alanı.
- Villa/malikane ilerlemesi.

### Meslek ve Ev Bağlantısı

Ev oyuncunun mesleğine küçük görsel ve mekanik izler taşımalı:

- Yazılımcı: bilgisayar masası.
- Fotoğrafçı: fotoğraf panosu.
- Barista: kahve köşesi.
- Doktor: düzenli çalışma rafı.
- İç Mimar: daha fazla dekor puanı.

### Ev Sistemi Kararı

Ev sistemi MVP'de hafif tutulacak. Ana görevi oyuncunun karakter ve meslek
kimliğini görselleştirmek olacak.

## 5. Ekonomi Sistemi

### MVP Amacı

Ekonomi oyuncuya seçim yaptırmalıdır; oyuncuyu yormamalı veya ödeme baskısına
itmemelidir.

### Para Kaynakları

MVP para kaynakları:

- Meslek vardiyaları.
- Günlük görevler.
- Mini oyun başarıları.
- NPC görev ödülleri.

MVP para harcama alanları:

- Kıyafet.
- Küçük dekor.
- Hediye.
- Aktivite ücreti.
- Beceri dersi.

### Ekonomi İlkeleri

- İlk oturumda para yetmezliği hissi verilmez.
- İlk gün temel kıyafet/dekor deneyimi ücretsiz veya çok ucuz olmalıdır.
- Meslek seçimi gelir farkı yaratır ama tek doğru meslek olmamalıdır.
- Kozmetik harcamalar keyifli olmalı, zorunlu hissettirmemelidir.
- Reklam izleme ilerlemenin ana yolu olmamalıdır.

### Para Birimleri

MVP için tek ana para birimi önerilir:

- Coin.

Premium para birimi Faz 0'da tasarlanabilir ama MVP prototipinde kullanılmamalı.

### Ekonomi Sistemi Kararı

MVP ekonomisi tek para birimli, sade ve oyuncuya seçim yaptıran bir yapı olacak.

## 6. Günlük Görev ve İlerleme Sistemi

### MVP Amacı

Günlük görevler 5 dakikalık oturumu anlamlı hale getirir.

### Günlük Görev Yapısı

Her gün oyuncuya 3 hedef sunulur:

- 1 meslek hedefi.
- 1 sosyal/NPC hedefi.
- 1 kişisel/ev hedefi.

Örnek:

- Kafede 1 vardiya yap.
- Parkta Lina ile konuş.
- Evine yeni bir dekor yerleştir.

Oyuncu hepsini yapmak zorunda değildir. Birini tamamlamak bile ilerleme hissi
vermelidir.

### İlerleme Katmanları

MVP'de ilerleme şu katmanlarda tutulur:

- Oyuncu level'ı.
- Meslek seviyesi.
- NPC ilişki seviyesi.
- Ev/dekor puanı.
- Şehir itibarı etiketi.

Şehir itibarı etiketi örnekleri:

- Çalışkan.
- Sosyal.
- Yaratıcı.
- Yardımsever.
- Düzenli.

Bu etiketler NPC tepkilerinde kullanılabilir.

## 7. Multiplayer Sistemi

### MVP Durumu

Multiplayer Pixel Life için uzun vadede önemli ama MVP'nin ana riski haline
getirilmemelidir.

MVP kararı:

- İlk üretim MVP'sinde multiplayer zorunlu değildir.
- GDD'de 2 kişilik lobby tasarımı korunur.
- Teknik prototip aşamasında ayrı risk çalışması yapılır.

İlk multiplayer deneyimi şu olmalıdır:

- Arkadaşını eve davet et.
- Birlikte kafe/park etkinliğine katıl.
- Basit ortak mini oyun oyna.

MMO yapılmayacaktır.

## Sistemler Arası Veri İlişkisi

MVP'de her oyuncu profili şu temel verileri taşımalıdır:

- Karakter kimliği.
- Başlangıç eğilimi.
- Aktif meslek.
- Meslek seviyeleri.
- NPC ilişki durumları.
- Tamamlanan görevler.
- Ev/dekor durumu.
- Para.
- Şehir itibarı etiketleri.
- Açık lokasyonlar.

Bu veri modeli, ileride teknik mimariye temel olacaktır.

## Gün 4 Kararları

Bugün kilitlenen geçici kararlar:

- MVP'nin ana omurgası meslek + NPC tepkisi + şehir hafızası olacak.
- İlk 5 meslek: Barista, Yazılımcı, Fotoğrafçı, Doktor, İç Mimar.
- MVP başlangıç karakter sistemi hızlı ve hafif olacak.
- MVP'de 10 ana NPC hedeflenecek.
- Ev sistemi tek ev tipi ve temel dekorla sınırlı tutulacak.
- Ekonomi tek ana para birimiyle sade başlayacak.
- Multiplayer MVP için opsiyonel, ana üretim riski yapılmayacak.

Henüz kilitlenmeyen kararlar:

- İlk 10 NPC'nin kesin adları.
- İlk 5 mesleğin görev zincirleri.
- Şehir itibarı etiketlerinin kesin listesi.
- Ekonomi fiyat dengeleri.
- Multiplayer'ın ilk teknik denemeye ne zaman alınacağı.

## Gün 5'e Taşınan Sorular

- İlk hikaye arkı hangi olayla başlayacak?
- 100 level yapısının MVP ilk 20 level'a karşılığı ne olacak?
- İlk 10 NPC kimler olacak?
- İlk 20 görev tipi nasıl gruplandırılacak?
- Meslek seçimi hikayeye ne kadar erken etki edecek?
