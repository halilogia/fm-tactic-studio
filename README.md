# ⚽ FM Tactic Studio — Football Manager Taktik Görüntüleyici

Football Manager 2026 ve önceki sürümler için geliştirilmiş, oyuna girmeden `.fmf` taktik dosyalarını inceleyebileceğiniz, dizilişleri ve oyuncu rollerini görsel futbol sahası üzerinde yönetebileceğiniz yerel masaüstü aracı.

---

## 🚀 Hızlı Başlatma

1. Klasördeki **`run.bat`** dosyasına çift tıklayın.
2. Tarayıcınızda otomatik olarak açılır:
   ```
   http://127.0.0.1:8765
   ```

---

## 🎯 Özellikler

1. **Otomatik Taktik Taraması:**
   - Standart Football Manager taktik dizinindeki (`Documents\Sports Interactive\Football Manager [Yıl]\tactics`) veya `config.local.json` / `FM_TACTICS_DIR` ortam değişkeniyle belirttiğiniz özel klasördeki tüm `.fmf` dosyalarını otomatik listeler.
2. **Sports Interactive Binary & Zstd TOC Ayrıştırıcısı:**
   - `.fmf` arşivinin içindeki `.tac` dosya boyutunu, sıkıştırma oranını, `.img` ve `.aom` meta verilerini gösterir.
3. **2D İnteraktif Taktik Tahtası:**
   - Formasyonlar (4-2-3-1, 4-3-3 Gegenpress, 4-4-2, 5-2-3, 3-5-2, 4-1-2-1-2 Baklava vb.).
   - Sahadaki 11 oyuncuyu fareyle serbestçe sürükleyip bırakabilme.
   - Tüm Football Manager mevkileri, rolleri (Libero Kaleci, Sahte Dokuz, Gezgin Oyun Kurucu, vb.) ve görevleri (Savunma, Destek, Hücum).
4. **Zihniyet ve Takım Talimatları:**
   - `.fmf` içindeki takım talimatları, diziliş ve zihniyet bu sürümde okunamıyor. Taktik tahtasındaki seçimler manuel planlama içindir; dosyadan alınmış bilgi olarak gösterilmez.
5. **Kişisel Notlar ve Kalıcı Kayıt:**
   - Her taktik için özel notlar ekleyebilir ve tek tıkla kaydedebilirsiniz.
6. **Sortitoutsi Entegrasyonu:**
   - Taktik dosyasını tek tıkla topluluk motorunda açma kısayolu.
7. **FM 26 / FM 27 Sabit Slotlu Saha & Oyuncu Takası (Swap):**
   - Serbest piksel kaydırma yerine FM 26/27'nin 24 sabit taktiksel slotu (`GK`, `DL..DR`, `WBL..WBR`, `DMCL..DMCR`, `ML..MR`, `AML..AMR`, `STCL..STCR`) üzerinde sürükle-bırak ile oyuncu yer değiştirme (swap) ve boş mevkilere taşıma.
8. **Entegre Universal Scout (Excel Tablosu & Gizli Özellikler):**
   - Üst bardaki **Scout (FM 26/27)** sekmesinden `.fm` kayıt dosyalarını (`Football Manager 26\games` / `27\games` veya manuel dosya seçimi) doğrudan yükleme, Excel tarzı sütun altı filtrelerle 46.000+ oyuncuyu CA/PA, Tutarlılık, Önemli Maçlar, Sakatlık Eğilimi, Hırs ve Profesyonellik kriterlerine göre milisaniyeler içinde süzme ve Excel/CSV olarak dışa aktarma.
9. **Ayarlar, Temalar ve Dil Desteği:**
   - Üst bardaki **Ayarlar** düğmesinden **Karanlık**, **Aydınlık** ve **OLED** temaları ile **Türkçe / English** arayüz dili seçimi. Tercihler otomatik kaydedilir; açık tema tüm panelleri, tabloları, giriş alanlarını ve modalları kapsar.
10. **Mevkiye Göre Sıralama:**
   - Scout tablosundaki **Mevki** başlığına tıklayarak kadroyu kaleciden forvete (`GK → ST`) veya tersi yönde sıralama.
11. **Altyapı / Genç Takım Etiketleri:**
   - Her kulübün genç takım oyuncuları (`U19`, `U18`, `U17`, `Rezerv`) kulüp sütununda rozetle gösterilir (ör. `Beşiktaş A.Ş. U19`); oyuncu kartında tam takım adı, CSV çıktısında yaş grubu sütunu yer alır.
   - Üst bardaki **Altyapı** filtresi yalnızca genç/rezerv oyuncuları listeler; kulüp seçici ve aktif kulüp şeridi `(35 Oyuncu • 9 Altyapı)` gibi altyapı sayısını gösterir.
