# Pixel Life GDD

## Belge Durumu

Bu belge Pixel Life projesinin ana tasarım dokümanıdır. Faz 0 boyunca kod
yazmak yerine bu belgeyi genişleteceğiz. Belge, ileride üretim araçlarının ve
kod ajanlarının uyması gereken karar kaynağı olacaktır.

Çalışma kuralı:

> Bu özellik, oyunun temel vaadini güçlendiriyor mu, yoksa sadece ilginç olduğu
> için mi ekleniyor?

Bu soruya güçlü bir cevap vermeyen özellikler beklemeye alınır.

## 1. Vizyon

Pixel Life, modern bir şehirde geçen, piksel sanat estetiğine sahip, oyuncunun
çocukluktan hayal hayatına kadar kendi yaşam yolunu kurduğu sosyal yaşam
simülasyonudur.

Oyunun ana vaadi:

- Oyuncu kendi karakterini ve hayat yönünü belirler.
- Meslek, sosyal çevre, ev, şehir ve hikaye oyuncunun seçimlerine göre değişir.
- Şehir oyuncuyu tanır; NPC davranışları ve görevler oyuncunun kimliğine,
  mesleğine ve ilişkilerine göre farklılaşır.
- Oyun yalnızca görev tamamlatmaz; oyuncuya "benim karakterimin hayatı" hissini
  verir.

## 2. Marka Konumu

Pixel Life tek bir oyun olarak değil, uzun vadeli bir fikri marka olarak
tasarlanır.

Marka merdiveni:

1. Mobil oyun.
2. Discord topluluğu.
3. TikTok ve Instagram kısa içerikleri.
4. YouTube geliştirme ve hikaye içerikleri.
5. Merch ürünleri.
6. Animasyon kısa serileri.
7. Kart oyunu veya yan ürünler.

İlk hedef, markanın oyun tarafındaki temel kimliğini sabitlemektir: ad, sanat
stili, temel mekanikler, hedef kitle ve ürün vaadi.

## 3. Oyun Adı

Çalışma adı: Pixel Life

Alternatifler:

- PixelLife
- Pixel Life: City Stories
- Pixel Life: My Story
- Mini Life City

Şimdilik ana ad "Pixel Life" olarak kullanılır. Nihai ad kararı Faz 0 sonunda
verilir.

Gün 1 geçici karar:

- Çalışma adı Faz 0 boyunca "Pixel Life" olarak kullanılacak.
- Kısa slogan: "Kendi hayatını yaşa; şehir seni tanısın."
- Nihai ticari ad, marka ve alan adı araştırması yapılmadan kilitlenmeyecek.
- Ana tür tanımı: sosyal yaşam simülasyonu.

Detaylı kimlik dokümanı: `docs/phase-0-day-1-identity.md`

## 4. Hikaye

Oyuncu küçük bir şehirde hayata başlar. Aile, okul, arkadaşlıklar, ilk işler,
kariyer seçimleri ve ilişkiler üzerinden kendi yaşam hikayesini kurar.

Ana hikaye çizgisi:

- Çocukluk: aile, temel karakter özellikleri, ilk arkadaşlıklar.
- Ergenlik: okul, hobiler, sosyal çevre, ilk kişisel hedefler.
- Yetişkinlik: meslek seçimi, ev, ilişkiler, şehirde tanınma.
- Yaşlılık: miras, tamamlanan hedefler, hayatın anlamı, yeni nesil etkisi.

Hikaye tek bir zorunlu rota değildir. Oyuncunun mesleği, ilişkileri ve seçimleri
hangi görevlerin açılacağını belirler.

## 5. Evren

Pixel Life evreni sıcak, güvenli, renkli ve sosyal bir modern şehir üzerine
kurulur. Şehir gerçekçi olmak zorunda değildir; anlaşılır, okunaklı ve
oyuncunun zihninde kolay yer eden bir yaşam alanı olmalıdır.

İlk şehir: Merkez Şehir

Temel bölgeler:

- Merkez Meydan
- Kafe
- AVM
- Okul
- Üniversite
- Spor Salonu
- Hastane
- Park
- Sinema
- Orman
- Göl
- Sahil
- İş Merkezi
- Ev Bölgesi
- Belediye
- Metro

Her lokasyon için cevaplanacak sorular:

- Neden var?
- Oyuncu burada ne yapar?
- Hangi NPC'ler burada yaşar veya çalışır?
- Hangi görevler burada çıkar?
- Hangi meslekler burayla bağlantılıdır?
- Hangi mini oyun veya aktivite burada oynanır?

Gün 3 şehir kararı:

- İlk şehir adı Merkez Şehir olarak korunacak.
- MVP için 10 lokasyon hedeflenecek: Merkez Meydan, Ev Bölgesi, Kafe, Park,
  Okul, Üniversite, İş Merkezi, AVM, Spor Salonu, Hastane.
- İlk açık lokasyonlar: Ev Bölgesi, Merkez Meydan, Kafe, Park.
- Sahil, Orman ve Göl MVP sonrası atmosfer ve genişleme bölgeleri olarak
  tutulacak.
- Şehir tek ekranda başlayacak, ileride bölgelere genişleyecek.

Detaylı şehir dokümanı: `docs/phase-0-day-3-world-city.md`

## 6. Hedef Kitle

Birincil hedef kitle:

- 15-35 yaş arası oyuncular.
- Yaşam simülasyonu sevenler.
- Mobilde kısa ama anlamlı oturumlar oynamak isteyenler.
- Arkadaşlarıyla küçük ölçekli sosyal oyunlar oynamak isteyenler.
- Karakter özelleştirme, ev dekorasyonu ve ilişki sistemlerini sevenler.

İkincil hedef kitle:

- Cozy game oyuncuları.
- Stardew Valley, The Sims, Animal Crossing, Habbo, BitLife ve benzeri
  deneyimlerden hoşlanan oyuncular.
- TikTok/Instagram üzerinden karakter hikayeleri paylaşabilecek kitle.

Gün 2 oyuncu deneyimi kararı:

- MVP'nin ilk yaş evresi genç yetişkin olarak tasarlanacak.
- İlk 10 dakika karakter kimliği, ilk lokasyon ve NPC tepkisini kanıtlayacak.
- Günlük 5 dakikalık oturum ana tasarım birimi kabul edilecek.
- İlk oturumda mağaza, reklam veya agresif monetizasyon gösterilmeyecek.

Detaylı oyuncu deneyimi dokümanı:
`docs/phase-0-day-2-player-experience.md`

## 7. Temel Oyun Döngüsü

Kısa döngü:

1. Gün başlar.
2. Oyuncu hedef veya lokasyon seçer.
3. Aksiyon veya mini oyun oynar.
4. Kaynaklar, ilişkiler ve görevler güncellenir.
5. Yeni seçenekler açılır.

Orta döngü:

1. Oyuncu beceri ve ilişki geliştirir.
2. Meslek seviyesinde ilerler.
3. Ev, kıyafet, pet ve dekorasyon alır.
4. Şehirdeki itibarı değişir.

Uzun döngü:

1. Yaşam evresi ilerler.
2. Büyük hikaye kararları verilir.
3. Oyuncunun hayat yolu benzersizleşir.
4. 100 level boyunca çocukluktan hayal hayatına ulaşılır.

## 8. Farklılaşma İlkesi

Oyunun en önemli farkı şudur:

> Her oyuncuya aynı görevleri yaptırmamak.

Örnek:

- Yazılımcı oyuncuya teknoloji, start-up, hata çözme ve ekip yönetimi görevleri
  gelir.
- Fotoğrafçı oyuncuya çekim, müşteri, etkinlik ve portfolyo görevleri gelir.
- Doktor oyuncuya hastane, acil durum, etik karar ve uzmanlık görevleri gelir.

NPC'ler de oyuncuya mesleğine, geçmiş seçimlerine, ilişki durumuna ve şehirdeki
itibarına göre farklı davranır.

Bu sistem tekrar oynanabilirliğin ana taşıyıcısıdır.

## 9. Karakter Sistemi

Oyuncu karakteri şu alanlarla oluşturulur:

- Cinsiyet.
- Saç.
- Göz.
- Kıyafet.
- Yüz.
- Boy.
- Ten.

Yaşam evreleri:

1. Çocuk.
2. Ergen.
3. Yetişkin.
4. Yaşlı.

Her evre yeni mekanik, görev ve sosyal beklenti açar.

## 10. Meslek Sistemi

Meslek sistemi oyunun ana derinlik sistemlerinden biridir.

İlk meslek listesi:

- Çiftçi
- Aşçı
- Tamirci
- Doktor
- Öğretmen
- Yazılımcı
- Müzisyen
- Fotoğrafçı
- İç Mimar
- Veteriner
- Avukat
- Polis
- İtfaiyeci
- Çiçekçi
- Pastacı
- Pilot
- Kasap
- Kuaför
- Barmen
- Grafik Tasarımcı

Her meslek için tasarlanacak başlıklar:

- Bina.
- Mini oyun.
- Gelir modeli.
- Günlük görevler.
- Kariyer seviyeleri.
- Mesleğe özel NPC tepkileri.
- Mesleğe özel hikaye görevleri.

Gün 4 sistem kararı:

- MVP'nin ana omurgası Meslek Sistemi + NPC Tepki Sistemi + Şehir Hafızası
  olacak.
- İlk 5 meslek: Barista, Yazılımcı, Fotoğrafçı, Doktor, İç Mimar.
- Karakter sistemi hızlı kimlik kurma için hafif tutulacak.
- Ev sistemi MVP'de tek ev tipi ve temel dekorla sınırlı olacak.
- Ekonomi tek ana para birimiyle başlayacak.
- Multiplayer MVP'de opsiyonel kalacak, ana üretim riski yapılmayacak.

Detaylı sistem dokümanı: `docs/phase-0-day-4-systems.md`

## 11. Ev Sistemi

Ev ilerleme basamakları:

1. Kulübe.
2. Küçük Ev.
3. Bahçeli Ev.
4. Villa.
5. Malikane.
6. Hayal Evi.

Her evde bulunabilecek alanlar:

- Mobilya.
- Mutfak.
- Yatak odası.
- Oyun odası.
- Garaj.
- Bahçe.
- Pet alanı.

Ev sistemi yalnızca kozmetik değildir. Dinlenme, mutluluk, sosyal davetler,
pet bakımı ve karakter kimliğiyle bağlantılıdır.

## 12. NPC Sistemi

İlk hedef: 30 ana NPC.

Her NPC için:

- Ad.
- Yaş.
- İş.
- Karakter.
- Günlük rutin.
- Doğum günü.
- Arkadaşları.
- Oyuncuyla ilişki seviyesi.
- Sevdiği ve sevmediği hediyeler.
- Mesleklere göre oyuncuya verdiği tepkiler.

NPC'ler oyuncuya yalnızca konuşma metni vermez; şehirde yaşayan karakterler gibi
hissettirilir.

## 13. Hikaye ve Level Yapısı

Toplam hedef: 100 level.

Level aralıkları:

- 1-10: Çocukluk.
- 11-20: İlk okul.
- 21-30: Lise.
- 31-40: Üniversite.
- 41-55: Meslek.
- 56-70: İlk ev.
- 71-85: Birlikte yaşam.
- 86-100: Hayal hayatı.

Her aralıkta:

- Yeni lokasyonlar.
- Yeni NPC bağlantıları.
- Yeni meslek veya beceri seçenekleri.
- Ana hikaye kararları.
- Oyuncu kimliğini belirleyen kalıcı sonuçlar.

Gün 5 hikaye ve içerik kararı:

- MVP ilk hikaye arkı "Yeni Başlangıç Haftası" olacak.
- MVP ilk 20 level, genç yetişkin şehir başlangıcı olarak tasarlanacak.
- İlk ana görev zinciri "Şehir Seni Tanısın" olacak.
- İlk 10 ana NPC: Ece, Mert, Lina, Deniz, Selin, Dr. Arda, Ayla, Bora, Nil,
  Kerem.
- İlk 20 görev tipi sistemsel şablonlar olarak tanımlandı.
- Meslek seçimi görev, NPC ve şehir itibarı ayrışmasını erken başlatacak.

Detaylı hikaye ve içerik dokümanı:
`docs/phase-0-day-5-story-content.md`

## 14. Multiplayer

İlk sürümde MMO hedeflenmez.

Plan:

1. 2 kişi.
2. 4 kişi.
3. 8 kişi.

Model:

- Lobby sistemi.
- Arkadaş daveti.
- Ortak aktiviteler.
- Mini oyunlar.
- Ev ziyareti.
- Etkinlik katılımı.

Multiplayer, tek oyunculu hayat simülasyonunu bozmadan sosyal bir katman olarak
eklenir.

## 15. Ekonomi

Para kazanma kaynakları:

- Görev.
- Meslek.
- Satış.
- Etkinlik.
- Mini oyun başarıları.

Harcama alanları:

- Ev.
- Araba.
- Kıyafet.
- Pet.
- Dekorasyon.
- Eğitim.
- Sosyal aktiviteler.

Ekonomi oyuncuyu cezalandırmak için değil, seçim yaptırmak için kullanılır.

## 16. Para Kazanma Modeli

İlk model:

- Ücretsiz oynanabilir.
- Kozmetik ürünler.
- Ev ve dekor paketleri.
- Sezonluk etkinlik biletleri.
- Reklam opsiyonel ve ödüllü olmalı.

Kaçınılacaklar:

- Pay-to-win.
- Zorunlu reklam.
- Çocuk oyuncuları manipüle eden karanlık desenler.
- Ana hikayeyi ödeme duvarına koymak.

## 17. Teknik Mimari

Hedef platform sırası:

1. Web prototip.
2. Android.
3. iOS.
4. Steam.

Önerilen teknik yön:

- Oyun motoru: Phaser veya Unity kararı Faz 0 sonunda netleşir.
- Backend: Supabase veya özel Node.js servisleri.
- Multiplayer: lobby tabanlı küçük oturumlar.
- Veri: oyuncu profili, görev durumu, envanter, ilişkiler, ekonomi.
- İçerik üretimi: GDD merkezli, veri tablolarıyla genişleyebilen yapı.

Teknik kararlar, tasarım belgesi kilitlenmeden kalıcılaştırılmaz.

Gün 6 teknik karar:

- İlk üretim hattı Phaser + TypeScript ile devam edecek.
- Unity mobil MVP öncesinde yeniden değerlendirilecek, şimdilik ana hat
  olmayacak.
- Backend başlangıcı yönetilen servis yaklaşımıyla yapılacak; Supabase benzeri
  çözüm ilk adaydır.
- İçerikler kod içine gömülmeyecek; JSON/tablo temelli veri akışı kurulacak.
- Multiplayer MVP'nin ana riski yapılmayacak; 2 kişilik lobby ayrı risk testi
  olarak ele alınacak.

Detaylı teknik ve üretim dokümanı:
`docs/phase-0-day-6-technical-production.md`

## 18. İlk Sürüm Kapsamı

MVP hedefi:

- 1 şehir: Merkez Şehir.
- 8-10 lokasyon.
- 1 yaşam evresi: ergen veya genç yetişkin.
- 5 meslek.
- 10 NPC.
- 20-30 görev.
- 1 ev tipi ve sınırlı dekorasyon.
- Basit karakter oluşturma.
- Tek oyunculu temel döngü.
- 2 kişilik sınırlı multiplayer deneyi opsiyonel.

MVP'nin amacı tüm oyunu yapmak değil, temel vaadin çalıştığını kanıtlamaktır:

> Oyuncu, kendi seçtiği yaşam yolunun şehir ve NPC'ler tarafından fark edildiğini
> hissetmelidir.

## 19. Faz Planı

Faz 0: Vizyon ve GDD.

- Süre: 1 hafta.
- Kod yok.
- Çıktı: 80-150 sayfalık GDD.
- Kararlar: ad, hikaye, evren, karakterler, hedef kitle, para kazanma modeli,
  teknik mimari, ilk sürüm kapsamı.

Faz 1: Dünya Tasarımı.

- Süre: 1-2 hafta.
- Şehir ve lokasyonlar detaylandırılır.

Faz 2: Karakter Sistemi.

- Karakter oluşturma ve yaşam evreleri tasarlanır.

Faz 3: Meslek Sistemi.

- Meslekler, mini oyunlar, binalar, gelir ve kariyer seviyeleri tasarlanır.

Faz 4: Ev Sistemi.

- Ev ilerlemesi, dekorasyon ve ev içi mekanikler tasarlanır.

Faz 5: NPC.

- 30 NPC tasarlanır.

Faz 6: Hikaye.

- 100 level ana yapı detaylandırılır.

Faz 7: Multiplayer.

- 2, 4 ve 8 kişilik lobby yapısı tasarlanır.

Faz 8: Ekonomi.

- Kazanç ve harcama dengesi tasarlanır.

Faz 9: Mobil.

- Android, iOS ve Steam yayın planı hazırlanır.

Faz 10: Beta.

- 100 kişi, 1000 kişi ve store çıkışı planlanır.

## 20. Açık Kararlar

Faz 0 sonunda kilitlenecek kararlar:

- Nihai oyun adı.
- Sanat stili referansları.
- İlk yaş evresi.
- İlk şehir kapsamı.
- İlk 5 meslek.
- İlk 10 NPC.
- MVP platformu.
- Multiplayer'ın MVP'ye girip girmeyeceği.
- Monetizasyon sınırları.

Bu kararlar kilitlenmeden üretim kapsamı büyütülmez.
