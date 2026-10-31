/**
 * FM Tactic Studio - Settings, Theme Switcher and TR/EN Localization
 */

type ThemeName = "dark" | "light" | "oled";
type Language = "tr" | "en";

interface AppSettings {
  theme: ThemeName;
  language: Language;
}

const SETTINGS_KEY = "fm-tactic-studio.settings.v1";
const DEFAULT_SETTINGS: AppSettings = { theme: "dark", language: "tr" };

const EXACT_EN: Record<string, string> = {
  // ---- Chrome / navigation ----
  "Taktik": "Tactics",
  "Taktiklerim": "My Tactics",
  "Yenile": "Refresh",
  "Sahayı İndir": "Download Pitch",
  "Ayarlar": "Settings",
  "Ekle": "Add",
  "Kapat": "Close",
  "Sıfırla": "Reset",
  "Kaydet": "Save",
  "Uygula": "Apply",
  "Ara": "Search",
  "Sil": "Delete",
  "Tamam": "OK",
  "İptal": "Cancel",
  "Evet": "Yes",
  "Hayır": "No",
  "Geri": "Back",
  "Tümü": "All",
  "Hiçbiri": "None",
  "Hazır": "Ready",
  "Bekliyor": "Waiting",
  "Yükleniyor...": "Loading...",
  "Yeni": "New",
  "Görünüm": "Appearance",
  "Tema": "Theme",
  "Dil": "Language",
  "Karanlık": "Dark",
  "Aydınlık": "Light",
  "Ayarlar otomatik olarak kaydedilir.": "Settings are saved automatically.",
  "Türkçe": "Turkish",

  // ---- Tactics panel ----
  "Taktik ara...": "Search tactics...",
  "Taktik dosyaları taranıyor...": "Scanning tactic files...",
  ".fmf Sürükle & Bırak": ".fmf Drag & Drop",
  "Aktif:": "Active:",
  "Diziliş:": "Formation:",
  "Zihniyet:": "Mentality:",
  "4-2-3-1 Geniş": "4-2-3-1 Wide",
  "4-3-3 DM Geniş (Gegenpress)": "4-3-3 DM Wide (Gegenpress)",
  "4-4-2 Klasik": "4-4-2 Classic",
  "5-2-3 Kanat Bekli": "5-2-3 Wing-Back",
  "3-5-2 Çift Forvet": "3-5-2 Two Strikers",
  "4-1-2-1-2 Baklava (Diamond)": "4-1-2-1-2 Diamond",
  "Çok Savunmacı": "Very Defensive",
  "Savunmacı": "Defensive",
  "Dengeli": "Balanced",
  "Pozitif Futbol": "Positive",
  "Pozitif": "Positive",
  "Hücumcu": "Attacking",
  "Çok Hücumcu": "Very Attacking",
  "Kulüp kadrosundan taktik tahtasına en iyi 11'i yerleştirir ve zayıf halkayı tespit eder": "Places the best XI from the club squad onto the tactic board and detects the weakest link",
  "En İyi 11 Öner": "Suggest Best XI",
  "FM 26/27 Sabit Slot Sistemi: Oyuncuyu dolu slota bırakırsanız": "FM 26/27 Fixed Slot System: if you drop a player on an occupied slot",
  "yer değiştirir (swap)": "they swap positions (swap)",
  ", boş slota bırakırsanız o mevkiye geçer.": ", if you drop them on an empty slot they move to that position.",

  // ---- Inspector ----
  "Oyuncu": "Player",
  "Talimatlar": "Instructions",
  ".FMF Verisi": ".FMF Data",
  "Hücum": "Attack",
  "Savunma": "Defence",
  "Destek": "Support",
  "Otomatik": "Automatic",
  "Oyuncu / Pozisyon Adı": "Player / Position Name",
  "FM Rolü": "FM Role",
  "Görev (Duty)": "Duty",
  "Sabit Saha Slotu:": "Fixed Pitch Slot:",
  "Bu Taktik İçin Notlarım": "My Notes for This Tactic",
  "Taktik zayıf/güçlü yönleri, rakip analizleri ve oyuncu talimatları...": "Weak/strong points, opposition analysis and player instructions...",
  "Değişiklikleri Kaydet": "Save Changes",
  "Topa Sahipken": "In Possession",
  "Hücum Genişliği:": "Attacking Width:",
  "Oldukça Geniş": "Fairly Wide",
  "Paslaşma Biçimi:": "Passing Style:",
  "Kısa Pas": "Short Passing",
  "Tempo:": "Tempo:",
  "Yüksek Tempo": "Higher Tempo",
  "Geçiş Evresi": "Transition",
  "Top Kaybedilince:": "When Possession Lost:",
  "Karşı Pres Yap": "Counter-Press",
  "Top Kazanılınca:": "When Possession Won:",
  "Kontraya Kalk": "Counter",
  "Top Rakipteyken": "Out of Possession",
  "Savunma Hattı:": "Defensive Line:",
  "Daha İleride": "Higher",
  "Pres Şiddeti:": "Pressing Intensity:",
  "Çok Sık Pres": "Much More Often",
  "Kısa Pasla Çık": "Play Out of Defence",
  "Önde Karşıla": "Higher",
  "Kaleci Dağıtımı:": "Goalkeeper Distribution:",
  "Pres Hattı:": "Line of Engagement:",
  "Ofsayt Taktiği:": "Offside Trap:",
  "Aktif": "On",
  "Standart": "Standard",
  "Beklere / Stopere": "Full-Backs / Centre-Backs",
  "SI Arşiv Özeti": "SI Archive Summary",
  "İçerik Tablosu (TOC)": "Table of Contents (TOC)",
  "Dosya:": "File:",
  "Boyut:": "Size:",
  "Tip:": "Type:",
  "Şifreleme:": "Encryption:",
  "Arşiv Motoru:": "Archive Engine:",
  "TOC öğesi bulunamadı": "No TOC entries found",
  "FM Taktik Klasörü": "FM Tactics Folder",
  "Klasör okunamadı": "Could not read folder",
  "Yeniden Dene": "Retry",
  "Yerel sunucuya bağlanılamadı": "Could not connect to the local server",
  "Lütfen sunucunun açık olduğundan emin olun.": "Please make sure the server is running.",
  "Klasörde .fmf dosyası bulunamadı.": "No .fmf file found in the folder.",

  // ---- Scout toolbar ----
  "FM 27 yeni kayıt dosyası algılandı (": "New FM 27 save detected (",
  ")! Altyapı/kadro değişikliklerinin yüklenmesi için yenileyin:": ")! Refresh to load youth/squad changes:",
  "Şimdi Yenile": "Refresh Now",
  "veya .fm dosya yolu yapıştırın...": "or paste a .fm file path...",
  "Kaydı Yükle": "Load Save",
  "Kayıt dosyasını diskten yeniden oku": "Re-read the save file from disk",
  ".fm Dosyası Seç": "Choose .fm File",
  "Kulüp yazın (ör: Beşiktaş)...": "Type a club (e.g. Beşiktaş)...",
  "Kulüp Kadrosunu Filtrele": "Filter Club Squad",
  "✔ Seç": "✔ Apply",
  "Kulüp Filtresini Sıfırla": "Reset Club Filter",
  "Hızlı arama (Ad, Ülke)...": "Quick search (Name, Nation)...",
  "Takip Listemdeki Oyuncular": "Players in My Shortlist",
  "Takip (": "Shortlist (",
  "Yaş ≤ 21 ve PA ≥ 150": "Age ≤ 21 and PA ≥ 150",
  "Kulüpsüz (Serbest) Oyuncular": "Free Agents",
  "Serbest": "Free",
  "Serbest (Kulüpsüz)": "Free Agent",
  "Sözleşmesi 2026-2027 İçinde Bitenler": "Contracts expiring in 2026-2027",
  "Sözleşme Sonu": "Expiring",
  "Sözleşme Bitiyor": "Contract Expiring",
  "Altyapı": "Academy",
  "Rezerv": "Reserve",
  "Sadece altyapı/genç takım oyuncuları": "Academy/youth team players only",
  "Takım": "Team",
  "Takım (Yaş Grubu)": "Team (Age Group)",
  "Yaş Grubu": "Age Group",
  "Aktif Kadro Filtresi:": "Active Squad Filter:",
  "Tüm Takımlara Dön": "Back to All Teams",
  "(Kadrosu & Kiralık Oyuncuları)": "(Squad & Loaned Players)",
  "Kadrosu & Kiralık Oyuncuları": "Squad & Loaned Players",
  "Takip Listesi": "Shortlist",
  "Oyuncu Adı": "Player Name",
  "Yaş": "Age",
  "Mevkiye göre sırala (GK → ST / ST → GK)": "Sort by position (GK → ST / ST → GK)",
  "Mevki": "Position",
  "Mevki Uygunluk %": "Position Suitability %",
  "Mevki ve Rol Uygunluk %": "Position & Role Suitability %",
  "Oyuncunun kayıtlı mevkilerine göre en iyi rol uygunluğu": "Best role suitability based on the player's registered positions",
  "Gelişim indeksi nasıl hesaplanır?": "How is the development index calculated?",
  "FM kayıt mevkileri:": "FM registered positions:",
  "uygun değil": "not eligible",
  "Gelişim Geçmişi": "Development History",
  "Gelişim Geçmişi (gerçek kayıtlar)": "Development History (real records)",
  "Mevcut Kaydı Yeni T0 Yap": "Set Current Save as New T0",
  "Kayıtlı nokta:": "Recorded points:",
  "(sezon başı)": "(season start)",
  "Takım Talimatları Okunamıyor": "Team Instructions Cannot Be Read",
  "FM, takım talimatlarını .fmf arşivinin içindeki şifreli .tac dosyasında saklıyor. Bu sürüm şifreli içeriği çözemediği için talimat uydurmuyor; yalnızca arşivde doğrulanabilen verileri gösteriyor.": "FM stores team instructions in the encrypted .tac file inside the .fmf archive. This version cannot decrypt it, so it does not invent instructions; only archive data that can be verified is shown.",
  "Arşiv öğesi:": "Archive entries:",
  "Dosya boyutu:": "File size:",
  "Diziliş ve zihniyeti yukarıdaki menülerden manuel seçebilir, notlarınızı kaydedebilirsiniz.": "You can choose the formation and mentality manually from the menus above and save your notes.",
  "Takım talimatları .fmf içindeki şifreli .tac dosyasından okunamıyor. Diziliş ve zihniyeti yukarıdan manuel seçebilir, notlarınızı kaydedebilirsiniz.": "Team instructions cannot be read from the encrypted .tac file inside the .fmf. You can choose the formation and mentality manually above and save your notes.",
  "Arşiv çözümlendi (talimatlar şifreli)": "Archive parsed (instructions encrypted)",
  "Rol %": "Role %",
  "Potansiyel Zirve Puanı %": "Peak Potential Rating %",
  "Pot %": "Pot %",
  "Gelişim ve Antrenman İndeksi (S/A+/A/B/C)": "Development & Training Index (S/A+/A/B/C)",
  "Gelişim": "Dev.",
  "Gelişim İndeksi:": "Development Index:",
  "Kulüp": "Club",
  "Ülke": "Nation",
  "Fark": "Gap",
  "Tutarlılık (Consistency)": "Consistency",
  "Tutar.": "Cons.",
  "Önemli Maçlar": "Big Matches",
  "Önemli Maçlar (Big Matches)": "Big Matches",
  "Ö.Maç": "Big",
  "Sakatlık Eğilimi (Düşük İyi)": "Injury Proneness (lower is better)",
  "Sakatlık Eğilimi (Injury)": "Injury Proneness",
  "Sakat.": "Inj.",
  "Çok Yönlülük": "Versatility",
  "Çok Yönlülük (Versatility)": "Versatility",
  "ÇokYön": "Vers.",
  "Hırs (Ambition)": "Ambition",
  "Hırs": "Amb.",
  "Profesyonellik": "Professionalism",
  "Prof.": "Prof.",
  "Baskıya Dayanıklılık": "Pressure",
  "Baskı": "Press.",
  "Filtre": "Filter",
  "İsim filtrele...": "Filter name...",
  "≥Puan": "≥Score",
  "Kulüp...": "Club...",
  "Ülke...": "Nation...",
  "Toplam Eşleşen:": "Total Matches:",
  "Detaylı gizli özellik kartı, oyuncu karşılaştırma ve taktiğe atamak için satıra tıklayın.": "Click a row for the detailed hidden attributes card, player comparison and to assign the player to the tactic.",
  "Önceki 100": "Previous 100",
  "Sonraki 100": "Next 100",

  // ---- Modals ----
  "Otomatik En İyi 11 Öner & Transfer Hedefleri": "Auto Suggest Best XI & Transfer Targets",
  "Hedef Kulüp:": "Target Club:",
  "11'i Taktik Tahtasına Yerleştir": "Place XI on Tactic Board",
  "Kart seç → o dizilişin ideal 11": "Pick a card → that formation's ideal XI",
  "Yerleştir": "Apply",
  "Uygun hedef bulunamadı.": "No suitable target found.",
  "AI SEÇİMİ": "AI PICK",
  "En Zayıf Halka": "Weakest Link",
  "Transfer Hedefleri": "Transfer Targets",
  "Global Transfer Hedefi": "Global Transfer Target",
  "11 taktik tahtasına yerleştirildi ✅": "XI placed on the tactic board ✅",

  // ---- Scout status & detail modal ----
  "Kirada": "On Loan",
  "Kiralık": "Loaned In",
  "Cezalı": "Suspended",
  "Sakat": "Injured",
  "Kondisyon Düşük": "Low Condition",
  "Başlangıç (T0)": "Baseline (T0)",
  "Mevcut": "Current",
  "+1 Sezon": "+1 Season",
  "+2 Sezon": "+2 Seasons",
  "Zirve (PA)": "Peak (PA)",
  "Hava Topu": "Aerial",
  "Fiziksel": "Physical",
  "Vizyon": "Vision",
  "Teknik": "Technical",
  "Zihinsel": "Mental",
  "Sürat": "Pace",
  "Çirkeflik (Dirtiness)": "Dirtiness",
  "Kararlılık (Determination)": "Determination",
  "Uyum (Adaptability)": "Adaptability",
  "Genel Bakış": "Overview",
  "Gelişim Grafiği": "Growth Chart",
  "İlk ölçüm:": "First observation:",
  "📌 Ölçüm Başlangıcını Sıfırla": "📌 Reset Observation Baseline",
  "İlk Ölçümden Bu Yana Gelişen Nitelikler": "Attribute Changes Since First Observation",
  "Henüz karşılaştırılacak ikinci ölçüm yok. Oyun içinde ilerleyip kaydı yeniden yükleyin.": "No second observation yet. Advance in-game and reload the save.",
  "Kariyer başlangıç tarihi bu kayıt okuyucusundan alınamıyor; geçmiş değerler tahmin edilmez.": "This save reader does not expose the career start date; past values are not estimated.",
  "FM27 okuyucusunun alanları oyun içinde henüz doğrulanmadı. Oyundaki bilgilerle çelişirse oyun ekranını esas alın.": "FM27 reader fields are not yet verified in-game. If values conflict, use the game screen as the reference.",
  "(gerçek kayıtlar)": "(real observations)",
  "Keşif Notları": "Scout Notes",
  "Takip Notu": "Shortlist Note",
  "Takip listesinden çıkar": "Remove from shortlist",
  "Takip listesine ekle": "Add to shortlist",
  "Oyuncu adı yazın...": "Type a player name...",
  "Karşılaştırma": "Comparison",
  "Oyuncu Karşılaştırma": "Player Comparison",
  "Oyuncu profili ve analiz verileri yükleniyor...": "Loading player profile and analysis...",
  "Oyuncu detayları alınamadı.": "Could not fetch player details.",
  "Henüz pozitif nitelik artışı kaydedilmedi (oyunda birkaç ay ilerleyip save alınca görünecektir).": "No positive attribute growth recorded yet (it will appear after advancing a few months in-game and saving).",
  "Kaydedildi ✔": "Saved ✔",

  // ---- Messages (alerts) ----
  "Taktik notlarınız ve sabit saha slotlarınız başarıyla kaydedildi!": "Your tactic notes and fixed pitch slots were saved successfully!",
  "Kaydetme hatası: ": "Save error: ",
  "Yükleme hatası: ": "Upload error: ",
  "Sunucu Hatası: ": "Server Error: ",
  "Saha görseli dışa aktarılıyor... Ekran görüntüsü almak için Windows'ta Win+Shift+S tuşlarını da kullanabilirsiniz.": "Exporting pitch image... You can also use Win+Shift+S on Windows to take a screenshot.",
  "Formasyon analizi alınamadı": "Could not fetch formation analysis",
  "Yeniden yüklenemedi": "Could not reload",
  "Kayıt yenileme hatası: ": "Save reload error: ",
  "Lütfen listeden bir .fm kaydı seçin veya dosya yükleyin.": "Please select a .fm save from the list or upload a file.",
  "Kayıtlı .fm dosyası bulunamadı (Dosya Seç ile yükleyin)": "No saved .fm file found (load one via Choose File)",
  "Kayıt yüklenemedi": "Could not load save",
  "Kayıt dosyası okuma hatası: ": "Save file read error: ",
  "Yükleme başarısız": "Upload failed",
  "FM Save yükleme hatası: ": "FM save upload error: ",
  "Save ayrıştırılıyor (fmsave)...": "Parsing save (fmsave)...",
  "Scout sorgu hatası:": "Scout query error:",
  "Karşılaştırma hatası:": "Comparison error:",
  "Başlangıç noktası sabitleme hatası: ": "Baseline pinning error: ",

  // ---- Slot labels ----
  "Kaleci": "Goalkeeper",
  "Sol Bek": "Left Back",
  "Sol Stoper": "Left Centre-Back",
  "Merkez Stoper": "Centre-Back",
  "Sağ Stoper": "Right Centre-Back",
  "Sağ Bek": "Right Back",
  "Sol Kanat Bek": "Left Wing-Back",
  "Sol DOS": "Left DM",
  "Ön Libero": "Anchor",
  "Sağ DOS": "Right DM",
  "Sağ Kanat Bek": "Right Wing-Back",
  "Sol Orta Saha": "Left Midfielder",
  "Sol İç Orta": "Left Centre Mid",
  "Merkez Orta": "Centre Midfielder",
  "Sağ İç Orta": "Right Centre Mid",
  "Sağ Orta Saha": "Right Midfielder",
  "Sol Kanat": "Left Winger",
  "Sol OOS": "Left AM",
  "On Numara": "Attacking Midfielder",
  "Sağ OOS": "Right AM",
  "Sağ Kanat": "Right Winger",
  "Sol Santrafor": "Left Striker",
  "Santrafor": "Striker",
  "Sağ Santrafor": "Right Striker",
  "Sağ İç": "Right Centre Mid",
  "Sol İç": "Left Centre Mid",
  "Sağ Orta": "Right Midfielder",
  "Sağ Forvet": "Right Forward",
  "Sol Forvet": "Left Forward",

  "Oyuncu Rolü (manuel)": "Player Role (manual)",
  "Rol seçilmedi": "No role selected",
  "Sahadaki roller manuel planınızdır; .fmf içindeki oyuncu rolleri bu sürümde okunamıyor.": "Pitch roles belong to your manual plan; this version cannot read player roles from .fmf files.",

  // ---- Role names ----
  "Libero Kaleci": "Sweeper Keeper",
  "İki Yönlü Bek": "Full-Back",
  "Stoper": "Centre-Back",
  "Çakılı Stoper": "Stopper",
  "Pasör Stoper": "Ball-Playing Defender",
  "Kenar Stoper": "Wide Centre-Back",
  "Kanat Bek": "Wing-Back",
  "Gezgin Oyun Kurucu": "Roaming Playmaker",
  "Defansif Orta Saha": "Defensive Midfielder",
  "İki Yönlü Orta Saha": "Box-to-Box Midfielder",
  "Ofansif Orta Saha": "Attacking Midfielder",
  "Gizli Forvet": "Shadow Striker",
  "Derin Oyun Kurucu": "Deep-Lying Playmaker",
  "Ofansif Oyun Kurucu": "Advanced Playmaker",
  "Kanat Oyuncusu": "Winger",
  "Merkez Orta Saha": "Central Midfielder",
  "Ters Ayaklı Kanat": "Inverted Winger",
  "Kanat Forvet": "Inside Forward",
  "Yaratıcı Forvet": "Deep-Lying Forward",
  "Pres Yapan Forvet": "Pressing Forward",
  "Fırsatçı Golcü": "Poacher",
  "Sahte Dokuz": "False Nine",
  "Savaşçı Orta Saha": "Ball-Winning Midfielder",
  "Yarım Stoper": "Half-Back",
  "Çalışkan Kanat": "Wide Midfielder",
  "Ters Ayaklı Kanat Bek": "Inverted Wing-Back",
  "On Numara (Enganche)": "Trequartista",
  "Hedef Forvet": "Target Forward",
  "Komple Forvet": "Complete Forward",
  "Standart Bek": "No-Nonsense Full-Back"
};

const PHRASE_RULES: Array<[RegExp, string]> = [
  [/(\d[\d.,]*)\s+kayıt/g, "$1 records"],
  [/(\d[\d.,]*)\s+Oyuncu/g, "$1 Players"],
  [/(\d+)\s+oyuncu takip ediliyor/g, "$1 players tracked"],
  [/Ort CA:/g, "Avg CA:"],
  [/Yenilendi:/g, "Updated:"],
  [/Takas:/g, "Swap:"],
  [/Hedef Slot:/g, "Target Slot:"],
  [/kadrosu taranıyor, 6 diziliş simüle ediliyor\.\.\./g, "squad being scanned, 6 formations simulated..."],
  [/Kart seç → o dizilişin ideal 11/g, "Pick a card → that formation's ideal XI"],
  [/Sözleşme Bitiyor \(/g, "Contract Expiring ("],
  [/Kirada:/g, "On Loan:"],
  [/Kondisyon Düşük/g, "Low Condition"],
  [/Başlangıç \(T0\)/g, "Baseline (T0)"],
  [/\+(\d+) Sezon/g, "+$1 Seasons"],
  [/Henüz pozitif nitelik artışı kaydedilmedi/g, "No positive attribute growth recorded yet"],
  [/Mevcut kayıt verileri başlangıç noktası \(T0\) olarak sabitlendi!/g, "Current save data has been pinned as the baseline (T0)!"],
  [/"([^"]+)" isminde bir oyuncu bulunamadı\./g, 'No player named "$1" found.'],
  [/Topa Sahipken/g, "In Possession"],
  [/Klasör okunamadı/g, "Could not read folder"],
  [/Altyapı/g, "Academy"],
  [/Rezerv/g, "Reserve"],
  [/Henüz gerçek gelişim verisi yok/g, "No real development data yet"],
  [/Oyun içinde ilerleyip yeni bir save aldığınızda,/g, "Advance in-game and take a new save,"],
  [/T0 ile yeni tarih arasındaki gerçek CA değişimi burada görünecek/g, "the real CA change between T0 and the new date will appear here"],
  [/\(sezon başı\)/g, "(season start)"],
  [/yükleniyor ve taranıyor\.\.\./g, "uploading and scanning..."],
  [/Takip listesi meta verisi alınamadı/g, "Could not fetch shortlist metadata"],
  [/Kulüp listesi datalist'e yüklenemedi/g, "Could not load club datalist"],
  [/Hata:/g, "Error:"],
  [/(\d+)\s+oyuncu takip ediliyor/g, "$1 players tracked"]
];

function translateComposite(input: string): string {
  const translatePart = (part: string): string => {
    const trimmed = part.trim();
    const direct = EXACT_EN[trimmed];
    return direct !== undefined ? part.replace(trimmed, direct) : part;
  };

  let out = input;
  if (out.includes(" - ")) {
    out = out.split(" - ").map(translatePart).join(" - ");
  }
  if (out.includes("•")) {
    out = out.split("•").map(translatePart).join("•");
  }
  return out;
}

function getSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const theme: ThemeName = parsed.theme === "light" || parsed.theme === "oled" ? parsed.theme : "dark";
    const language: Language = parsed.language === "en" ? "en" : "tr";
    return { theme, language };
  } catch (err) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: AppSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Settings could not be saved:", err);
  }
}

function clearSettingQueryParams(): void {
  if (window.location.search) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  refreshSettingsControls(theme);
}

function setTheme(theme: ThemeName): void {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
  applyTheme(theme);
  clearSettingQueryParams();
}

function setLanguage(language: Language): void {
  const settings = getSettings();
  if (settings.language === language) {
    closeSettings();
    return;
  }
  settings.language = language;
  saveSettings(settings);
  window.history.replaceState(null, "", window.location.pathname);
  window.location.reload();
}

function refreshSettingsControls(themeOverride?: ThemeName, languageOverride?: Language): void {
  const settings = getSettings();
  const activeTheme = themeOverride || settings.theme;
  const activeLanguage = languageOverride || settings.language;
  document.querySelectorAll<HTMLElement>("[data-theme-choice]").forEach((btn) => {
    const active = btn.dataset.themeChoice === activeTheme;
    btn.className = active
      ? "theme-choice px-3 py-2 rounded-xl border text-xs font-bold bg-cyan-950/60 border-cyan-400 text-cyan-200 transition"
      : "theme-choice px-3 py-2 rounded-xl border text-xs font-semibold bg-fmDark/60 border-indigo-900 text-slate-300 hover:border-indigo-700 transition";
  });
  document.querySelectorAll<HTMLElement>("[data-lang-choice]").forEach((btn) => {
    const active = btn.dataset.langChoice === activeLanguage;
    btn.className = active
      ? "lang-choice px-3 py-2 rounded-xl border text-xs font-bold bg-indigo-950/90 border-cyan-400 text-cyan-200 transition"
      : "lang-choice px-3 py-2 rounded-xl border text-xs font-semibold bg-fmDark/60 border-indigo-900 text-slate-300 hover:border-indigo-700 transition";
  });
}

function openSettings(theme?: ThemeName, language?: Language): void {
  const modal = document.getElementById("settingsModal");
  if (!modal) return;
  refreshSettingsControls(theme, language);
  modal.classList.remove("hidden");
}

function closeSettings(): void {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.add("hidden");
}

interface InfoContent {
  title: string;
  body: string;
}

const INFO_TOPICS: Record<string, { tr: InfoContent; en: InfoContent }> = {
  devIndex: {
    tr: {
      title: "Gelişim İndeksi Nedir?",
      body: `
        <p><b>0-99</b> arası bir tahmindir; oyunun gizli gelişim modeli değildir.</p>
        <ul class="list-disc ml-4 space-y-1">
          <li><b>Zihinsel sürücü:</b> Profesyonellik × 0.45 + Kararlılık × 0.35 + Hırs × 0.20</li>
          <li><b>Ham puan:</b> (Zihinsel sürücü / 20) × 70 + min(30, (PA − CA) × 0.65) − sakatlık cezası</li>
          <li><b>Sakatlık cezası:</b> max(0, Sakatlık Eğilimi − 10) × 1.5</li>
          <li><b>Yaş çarpanı:</b> ≤18: 1.35 · ≤21: 1.25 · ≤24: 1.05 · ≤27: 0.75 · ≤30: 0.40 · 31+: 0.15</li>
          <li>PA − CA ≤ 0 veya yaş ≥ 33 ise indeks <b>0 (C)</b> olur.</li>
        </ul>
        <p>Yaş çarpanından sonra sonuç 5–99 aralığına sınırlanır ve bir ondalığa yuvarlanır (yukarıdaki sıfır koşulları hariç).</p>
        <p><b>Seviyeler:</b> S+ ≥ 85 · A+ ≥ 72 · A ≥ 58 · B ≥ 40 · C &lt; 40</p>
        <p class="text-slate-400">Kullanılanlar: yaş, profesyonellik, kararlılık, hırs, PA−CA farkı ve sakatlık eğilimi.</p>
      `
    },
    en: {
      title: "What Is the Development Index?",
      body: `
        <p>An estimate between <b>0-99</b>; it is not the game's hidden development model.</p>
        <ul class="list-disc ml-4 space-y-1">
          <li><b>Mental drive:</b> Professionalism × 0.45 + Determination × 0.35 + Ambition × 0.20</li>
          <li><b>Raw score:</b> (Mental drive / 20) × 70 + min(30, (PA − CA) × 0.65) − injury penalty</li>
          <li><b>Injury penalty:</b> max(0, Injury Proneness − 10) × 1.5</li>
          <li><b>Age multiplier:</b> ≤18: 1.35 · ≤21: 1.25 · ≤24: 1.05 · ≤27: 0.75 · ≤30: 0.40 · 31+: 0.15</li>
          <li>When PA − CA ≤ 0 or age ≥ 33, the index is <b>0 (C)</b>.</li>
        </ul>
        <p>After the age multiplier, the result is clamped to 5–99 and rounded to one decimal (except the zero conditions above).</p>
        <p><b>Tiers:</b> S+ ≥ 85 · A+ ≥ 72 · A ≥ 58 · B ≥ 40 · C &lt; 40</p>
        <p class="text-slate-400">Inputs: age, professionalism, determination, ambition, PA−CA gap and injury proneness.</p>
      `
    }
  }
};

function openInfoModal(topic: string): void {
  const data = INFO_TOPICS[topic];
  const modal = document.getElementById("infoModal");
  const title = document.getElementById("infoModalTitle");
  const body = document.getElementById("infoModalBody");
  if (!data || !modal || !title || !body) return;
  const lang = document.documentElement.lang === "en" ? "en" : "tr";
  title.textContent = data[lang].title;
  body.innerHTML = data[lang].body;
  modal.classList.remove("hidden");
}

function closeInfoModal(): void {
  const modal = document.getElementById("infoModal");
  if (modal) modal.classList.add("hidden");
}

function translateString(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return input;
  const direct = EXACT_EN[trimmed];
  if (direct !== undefined) {
    return input.replace(trimmed, direct);
  }
  let out = input;
  for (const [pattern, replacement] of PHRASE_RULES) {
    out = out.replace(pattern, replacement);
  }
  out = translateComposite(out);
  return out;
}

function translateTextNode(node: Text): void {
  const updated = translateString(node.nodeValue || "");
  if (updated !== node.nodeValue) {
    node.nodeValue = updated;
  }
}

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"];

function translateElement(element: Element): void {
  for (const attr of TRANSLATABLE_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (!value) continue;
    const updated = translateString(value);
    if (updated !== value) element.setAttribute(attr, updated);
  }
  for (const child of Array.from(element.childNodes)) {
    translateTreeNode(child);
  }
}

function translateTreeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = (node as Text).parentElement;
    if (parent && (parent.tagName === "SCRIPT" || parent.tagName === "STYLE" || parent.tagName === "TEXTAREA")) {
      return;
    }
    translateTextNode(node as Text);
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
    translateElement(el);
  }
}

function startTranslationObserver(): void {
  translateTreeNode(document.body);

  let pending = new Set<Node>();
  let scheduled = false;

  const flush = () => {
    scheduled = false;
    const nodes = Array.from(pending);
    pending = new Set<Node>();
    for (const node of nodes) {
      if (node.isConnected) translateTreeNode(node);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        pending.add(mutation.target);
      } else {
        mutation.addedNodes.forEach((node) => pending.add(node));
      }
    }
    if (!scheduled && pending.size > 0) {
      scheduled = true;
      window.requestAnimationFrame(flush);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function initializeSettings(): void {
  const settings = getSettings();
  const params = new URLSearchParams(window.location.search);
  const themeParam = params.get("theme");
  const langParam = params.get("lang");
  const theme: ThemeName = themeParam === "light" || themeParam === "oled" || themeParam === "dark" ? themeParam : settings.theme;
  const language: Language = langParam === "en" || langParam === "tr" ? langParam : settings.language;

  applyTheme(theme);
  document.documentElement.lang = language;
  refreshSettingsControls(theme, language);
  if (language === "en") {
    startTranslationObserver();
  }
  if (params.get("settings") === "1") {
    openSettings(theme, language);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettings();
      closeInfoModal();
    }
  });
}

function T(text: string): string {
  return document.documentElement.lang === "en" ? translateString(text) : text;
}

(window as any).T = T;
(window as any).openSettings = openSettings;
(window as any).closeSettings = closeSettings;
(window as any).openInfoModal = openInfoModal;
(window as any).closeInfoModal = closeInfoModal;
(window as any).setTheme = setTheme;
(window as any).setLanguage = setLanguage;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSettings);
} else {
  initializeSettings();
}
