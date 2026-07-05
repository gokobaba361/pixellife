# Faz 0 / Gün 3 - Dünya ve Şehir

## Amaç

Bugünün amacı Pixel Life'ın ilk şehri olan Merkez Şehir'i üretilebilir bir oyun
alanına çevirmektir. Şehir yalnızca arka plan değildir; oyuncunun kimliğini,
mesleğini, ilişkilerini ve ev hayatını görünür kılan ana sistemdir.

Temel şehir vaadi:

> Şehir, oyuncunun seçtiği hayat yolunu hatırlar ve ona göre tepki verir.

## Şehir Tasarım İlkeleri

Merkez Şehir şu ilkelerle tasarlanır:

- Okunaklı: Oyuncu hangi lokasyonun ne işe yaradığını hızlı anlar.
- Sıcak: Şehir güvenli, davetkar ve yaşanabilir hissettirir.
- Sistemsel: Her lokasyon en az bir ana sistemle bağlantılıdır.
- Sosyal: Her önemli lokasyon en az bir NPC ilişkisi üretir.
- Genişleyebilir: MVP lokasyonları sonraki fazlarda yeni katmanlar açabilir.
- Hatırlayan: Şehir, oyuncunun mesleği ve ilişkileriyle farklılaşır.

Kaçınılacak şehir hataları:

- Çok fazla lokasyonu ilk sürüme almak.
- Her lokasyonu yalnızca "tıkla ve kaynak kazan" noktasına çevirmek.
- Lokasyonları aynı işlevin farklı görseli yapmak.
- Oyuncuya ilk ekranda fazla seçenek verip kararsız bırakmak.

## Merkez Şehir Bölge Mantığı

Merkez Şehir tek bir düz liste değil, küçük bölgelere ayrılır.

İlk bölge yapısı:

```text
Merkez Meydan
|
|-- Sosyal Bölge
|   |-- Kafe
|   |-- Park
|   |-- Sinema
|
|-- Eğitim ve Kariyer Bölgesi
|   |-- Okul
|   |-- Üniversite
|   |-- İş Merkezi
|
|-- Yaşam Bölgesi
|   |-- Ev Bölgesi
|   |-- AVM
|   |-- Spor Salonu
|
|-- Kamu ve Sağlık Bölgesi
|   |-- Hastane
|   |-- Belediye
|
|-- Ulaşım ve Genişleme
|   |-- Metro
|   |-- Sahil
|   |-- Orman
|   |-- Göl
```

MVP'de oyuncuya bütün şehir aynı anda açılmaz. İlk ekran Merkez Meydan ve yakın
lokasyonlarla başlar. Yeni lokasyonlar level, hikaye veya meslek ilerlemesiyle
açılır.

## MVP Lokasyon Kararı

MVP için önerilen 10 lokasyon:

1. Merkez Meydan.
2. Ev Bölgesi.
3. Kafe.
4. Park.
5. Okul.
6. Üniversite.
7. İş Merkezi.
8. AVM.
9. Spor Salonu.
10. Hastane.

Opsiyonel MVP sonrası ilk genişleme:

- Sinema.
- Belediye.
- Metro.
- Sahil.

Faz sonrası atmosfer ve genişleme bölgeleri:

- Orman.
- Göl.
- Büyük sahil bölgesi.
- Etkinlik alanı.
- Havalimanı.

## Lokasyon Tasarımları

### 1. Merkez Meydan

Neden var?

Merkez Meydan oyuncunun şehirle ilk tanıştığı yerdir. Şehrin sosyal ve görsel
kalbidir.

Ne yapılır?

- Günlük duyurular alınır.
- Etkinlikler görülür.
- İlk NPC karşılaşmaları yaşanır.
- Şehir haritasına geçilir.
- Fotoğraf veya paylaşım kartı oluşturulur.

Hangi sistemlere bağlı?

- Onboarding.
- Günlük görev.
- Etkinlik.
- NPC karşılaşması.
- Şehir itibarı.

MVP görevi örnekleri:

- "Şehri tanı: meydanda 2 kişiyle konuş."
- "Bugünün etkinliğini kontrol et."
- "İlk şehir fotoğrafını çek."

NPC adayları:

- Belediye görevlisi.
- Sokak müzisyeni.
- Yeni oyuncuya rehberlik eden arkadaş karakter.

Meslek bağlantıları:

- Müzisyen.
- Fotoğrafçı.
- Grafik Tasarımcı.

Mini oyun fikri:

- Kısa ritim veya fotoğraf kadrajlama mini oyunu.

### 2. Ev Bölgesi

Neden var?

Ev, oyuncunun güvenli alanıdır. Karakter kimliği ve uzun vadeli sahiplenme burada
görünür.

Ne yapılır?

- Dinlenme.
- Kıyafet değiştirme.
- Dekorasyon.
- Pet bakımı.
- Arkadaş daveti.
- Gün planlama.

Hangi sistemlere bağlı?

- Ev sistemi.
- Enerji.
- Mutluluk.
- Dekorasyon.
- Multiplayer ev ziyareti.

MVP görevi örnekleri:

- "Odanı ilk kez düzenle."
- "Günü planla."
- "Dinlen ve enerjini yenile."

NPC adayları:

- Komşu.
- Ev sahibi veya emlakçı.
- Çocukluk arkadaşı.

Meslek bağlantıları:

- İç Mimar.
- Tamirci.
- Çiçekçi.

Mini oyun fikri:

- Dekor yerleştirme ve oda puanı.

### 3. Kafe

Neden var?

Kafe, erken oyunun sosyal ve ekonomik merkezidir. Oyuncuya ilk para kazanma ve
NPC tanışma fırsatını verir.

Ne yapılır?

- Vardiya.
- Arkadaşla buluşma.
- NPC sohbeti.
- Basit yemek/içecek mini oyunları.

Hangi sistemlere bağlı?

- Para.
- Sosyal ilişki.
- İlk iş deneyimi.
- Günlük hedefler.

MVP görevi örnekleri:

- "İlk vardiyanı tamamla."
- "Kafede Ece ile konuş."
- "Yoğun saatleri hatasız bitir."

NPC adayları:

- Barista Ece.
- Kafe sahibi.
- Sürekli gelen müşteri.

Meslek bağlantıları:

- Barista.
- Aşçı.
- Pastacı.
- Barmen.

Mini oyun fikri:

- Sipariş eşleştirme: doğru içeceği doğru müşteriye ver.

### 4. Park

Neden var?

Park, sosyal bağ ve mutluluk alanıdır. İlk arkadaşlık ve düşük baskılı sosyal
oyun burada yaşanır.

Ne yapılır?

- Sohbet.
- Spor dışı açık hava aktiviteleri.
- Pet gezdirme.
- Etkinlik ve piknik.

Hangi sistemlere bağlı?

- Sosyal.
- Mutluluk.
- Pet sistemi.
- Etkinlikler.

MVP görevi örnekleri:

- "Parkta yeni biriyle tanış."
- "Pet gezdir."
- "Piknik etkinliğine katıl."

NPC adayları:

- Fotoğrafçı Lina.
- Spor yapan Mert.
- Pet sahibi komşu.

Meslek bağlantıları:

- Fotoğrafçı.
- Veteriner.
- Müzisyen.

Mini oyun fikri:

- Fotoğraf kadrajlama veya pet yakalama mini oyunu.

### 5. Okul

Neden var?

Okul temel beceri kazanma ve gençlik hikayesi alanıdır. MVP genç yetişkinle
başlasa bile okul, temel beceri geliştirme binası olarak kalabilir.

Ne yapılır?

- Temel dersler.
- Beceri geliştirme.
- Kulüp aktiviteleri.
- NPC tanışma.

Hangi sistemlere bağlı?

- Beceri.
- Hikaye.
- Meslek ön koşulları.
- Sosyal çevre.

MVP görevi örnekleri:

- "Bir temel beceri dersi al."
- "Kulüp panosunu incele."
- "Öğretmenden kariyer tavsiyesi al."

NPC adayları:

- Öğretmen.
- Kulüp başkanı.
- Eski sınıf arkadaşı.

Meslek bağlantıları:

- Öğretmen.
- Yazılımcı.
- Grafik Tasarımcı.

Mini oyun fikri:

- Hafıza/kısa quiz değil, beceri odaklı basit ritim veya eşleştirme.

### 6. Üniversite

Neden var?

Üniversite ileri beceri ve meslek kapısıdır. Oyuncunun kariyer yönünü
netleştirdiği yerdir.

Ne yapılır?

- Uzmanlık dersleri.
- Staj bağlantıları.
- Kariyer danışmanlığı.
- Kulüp etkinlikleri.

Hangi sistemlere bağlı?

- Meslek açma.
- Beceri uzmanlığı.
- Hikaye dallanması.
- Sosyal çevre.

MVP görevi örnekleri:

- "İlk uzmanlık dersini seç."
- "Kariyer panosundan staj bak."
- "Bir kulüp etkinliğine katıl."

NPC adayları:

- Danışman hoca.
- Yazılım kulübü lideri.
- Müzik kulübü üyesi.

Meslek bağlantıları:

- Doktor.
- Avukat.
- Yazılımcı.
- Öğretmen.
- Grafik Tasarımcı.

Mini oyun fikri:

- Uzmanlık seçimine göre değişen kısa beceri sınaması.

### 7. İş Merkezi

Neden var?

İş Merkezi kariyer sisteminin ana kapısıdır. Meslekler burada görünür,
başvurular ve kariyer seviyeleri buradan takip edilir.

Ne yapılır?

- İş başvurusu.
- Vardiya.
- Kariyer görevi.
- Meslek seviyesi takibi.

Hangi sistemlere bağlı?

- Meslek.
- Para.
- Şehir itibarı.
- Görev zincirleri.

MVP görevi örnekleri:

- "İlk iş ilanını incele."
- "Bir meslek adayı seç."
- "Kariyer hedefini belirle."

NPC adayları:

- İnsan kaynakları görevlisi.
- Mentor karakter.
- Rakip çalışan.

Meslek bağlantıları:

- Yazılımcı.
- Avukat.
- Grafik Tasarımcı.
- İç Mimar.
- Fotoğrafçı.

Mini oyun fikri:

- Mesleğe özel ilk mini oyun kapısı.

### 8. AVM

Neden var?

AVM kişiselleştirme, alışveriş ve sosyal gezinme alanıdır.

Ne yapılır?

- Kıyafet alma.
- Dekor satın alma.
- Hediye alma.
- Etkinlik mağazalarını gezme.

Hangi sistemlere bağlı?

- Kozmetik.
- Ekonomi.
- Hediye.
- Monetizasyon sınırları.

MVP görevi örnekleri:

- "İlk kıyafet kombinini oluştur."
- "Bir NPC için hediye seç."
- "Odan için küçük dekor al."

NPC adayları:

- Mağaza çalışanı.
- Moda meraklısı arkadaş.
- Dekor satıcısı.

Meslek bağlantıları:

- Kuaför.
- İç Mimar.
- Çiçekçi.
- Grafik Tasarımcı.

Mini oyun fikri:

- Kombin puanı veya hediye eşleştirme.

### 9. Spor Salonu

Neden var?

Spor Salonu enerji, disiplin ve bazı meslek ön koşullarını destekler.

Ne yapılır?

- Antrenman.
- Sağlık ve enerji dengesi.
- NPC ile spor etkinliği.
- Kariyer gereksinimi.

Hangi sistemlere bağlı?

- Enerji.
- Mutluluk.
- Beceri.
- Meslek ön koşulları.

MVP görevi örnekleri:

- "İlk antrenmanını yap."
- "Mert ile spor salonunda buluş."
- "Enerjini dengelemeyi öğren."

NPC adayları:

- Antrenör Mert.
- Spor yapan öğrenci.
- Sağlıklı yaşam meraklısı NPC.

Meslek bağlantıları:

- Polis.
- İtfaiyeci.
- Doktor.

Mini oyun fikri:

- Zamanlamalı antrenman: doğru anda bas, formu koru.

### 10. Hastane

Neden var?

Hastane hem meslek hem de şehir olayları için önemlidir. Doktor, veteriner ve
acil durum görevlerinin merkezi olabilir.

Ne yapılır?

- Sağlık kontrolü.
- Doktorluk görevleri.
- NPC yardım görevleri.
- Hikaye olayları.

Hangi sistemlere bağlı?

- Sağlık.
- Meslek.
- Hikaye.
- Şehir olayları.

MVP görevi örnekleri:

- "Sağlık kontrolünden geç."
- "Hastanede gönüllü yardım et."
- "Bir NPC'ye ilaç götür."

NPC adayları:

- Doktor.
- Hemşire.
- Hasta NPC.

Meslek bağlantıları:

- Doktor.
- Veteriner.
- Polis.
- İtfaiyeci.

Mini oyun fikri:

- Basit teşhis eşleştirme veya doğru malzeme seçimi.

## MVP Dışında Tutulan Lokasyonlar

### Sinema

Değerli ama MVP için şart değil. İlişki ve etkinlik sistemleri olgunlaşınca çok
güçlü olur. İlk genişlemeye alınabilir.

### Belediye

Şehir itibarı, ruhsat ve büyük görevler için önemli. Ancak MVP'de sistemsel
yükü yüksek. Faz sonrası açılmalı.

### Metro

Ulaşım ve bölge genişletme için kritik. MVP tek bölgeyle başlarsa gerekmeyebilir.
İlk büyük şehir genişlemesinde eklenmeli.

### Sahil

Güçlü görsel ve sosyal bölge. MVP'ye koymak cazip ama kapsamı büyütür. İlk
sezonluk etkinlik veya genişleme bölgesi olabilir.

### Orman ve Göl

Atmosfer, pet, fotoğrafçılık ve doğa görevleri için iyi. Ancak ilk şehir
kimliği şehir yaşamı olduğu için MVP sonrası daha doğru.

## İlk Ekran Şehir Akışı

Oyuncunun ilk ekranda göreceği öncelik:

1. Merkez Meydan.
2. Kafe.
3. Park.
4. Ev Bölgesi.
5. Okul veya İş Merkezi ipucu.

Oyuncuya ilk anda 10 lokasyon gösterilse bile yalnızca 3-4 tanesi aktif
olmalıdır. Kilitli lokasyonlar merak üretir ama karar yükünü azaltır.

Önerilen ilk açık lokasyonlar:

- Ev Bölgesi.
- Merkez Meydan.
- Kafe.
- Park.

İlk kilitli ama görünen lokasyonlar:

- Okul.
- İş Merkezi.
- AVM.

Sonradan açılan ilk lokasyonlar:

- Spor Salonu.
- Üniversite.
- Hastane.

## Şehir ve Meslek Bağlantısı

Her meslek en az bir ana lokasyonla bağlanmalıdır.

Örnek:

- Barista: Kafe.
- Aşçı: Kafe, AVM yemek alanı.
- Yazılımcı: İş Merkezi, Üniversite.
- Doktor: Hastane, Üniversite.
- Öğretmen: Okul, Üniversite.
- Fotoğrafçı: Park, Merkez Meydan, AVM.
- İç Mimar: Ev Bölgesi, AVM.
- Polis: Belediye, İş Merkezi, şehir olayları.
- İtfaiyeci: Belediye, şehir olayları.
- Veteriner: Park, Hastane, pet sistemi.

Bu bağlantılar görevleri kişiselleştirmek için kullanılacaktır.

## Şehir Tepkisi Örnekleri

Oyuncu kafe odaklı ilerlerse:

- Kafe NPC'leri oyuncuyu adıyla çağırır.
- Kafe indirimleri açılır.
- Barista veya aşçı görevleri erken görünür.

Oyuncu sosyal ilerlerse:

- Park etkinlikleri daha sık önerilir.
- NPC mesajları artar.
- Grup etkinliği davetleri açılır.

Oyuncu eğitim/kariyer odaklı ilerlerse:

- Okul ve üniversite görevleri öne çıkar.
- İş Merkezi daha erken açılır.
- Mentor NPC oyuncuya farklı konuşur.

Oyuncu ev/dekor odaklı ilerlerse:

- AVM ve Ev Bölgesi görevleri öne çıkar.
- İç Mimar ve komşu NPC'leri daha aktif olur.
- Ev ziyareti sistemi erken tanıtılır.

## Gün 3 Kararları

Bugün kilitlenen geçici kararlar:

- İlk şehir adı: Merkez Şehir.
- MVP lokasyon hedefi: 10 lokasyon.
- İlk açık lokasyonlar: Ev Bölgesi, Merkez Meydan, Kafe, Park.
- MVP'nin sistem omurgası lokasyonlar üzerinden kurulacak.
- Şehir tek ekranda başlar, zamanla bölgelere genişler.
- Sahil, orman ve göl MVP sonrası atmosfer/genişleme bölgesi olarak tutulur.

Henüz kilitlenmeyen kararlar:

- Şehir haritasının nihai görsel kompozisyonu.
- İlk rehber NPC'nin adı ve rolü.
- Lokasyonların kesin açılma level'ları.
- MVP'de Üniversite ve Okul'un ayrı mı, birleşik mi olacağı.
- Belediye ve Metro'nun ilk genişlemedeki sırası.

## Gün 4'e Taşınan Sorular

- Karakter, meslek, ev, NPC ve ekonomi sistemlerinden hangisi MVP'nin ana
  omurgası olacak?
- İlk 5 meslek hangileri olmalı?
- İlk 10 NPC hangi lokasyonlara dağıtılmalı?
- Ev sistemi MVP'de ne kadar derin olmalı?
- Ekonomi oyuncuya seçim yaptıracak kadar derin ama yormayacak kadar basit nasıl
  tutulur?
