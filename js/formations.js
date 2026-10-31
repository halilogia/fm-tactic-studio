/**
 * Football Manager 2026 Formations Database & Role Mappings
 */

const FORMATIONS = {
  "4-2-3-1": [
    { id: 1, pos: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", x: 50, y: 82, num: 1 },
    { id: 2, pos: "DR", name: "Sağ Bek", role: "Kanat Bek", duty: "Su", x: 86, y: 68, num: 2 },
    { id: 3, pos: "DC", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", x: 62, y: 72, num: 4 },
    { id: 4, pos: "DC", name: "Sol Stoper", role: "Stoper", duty: "De", x: 38, y: 72, num: 3 },
    { id: 5, pos: "DL", name: "Sol Bek", role: "İki Yönlü Bek", duty: "At", x: 14, y: 68, num: 5 },
    { id: 6, pos: "DM", name: "Sağ DOS", role: "Defansif Orta Saha", duty: "De", x: 60, y: 53, num: 6 },
    { id: 7, pos: "DM", name: "Sol DOS", role: "Gezgin Oyun Kurucu", duty: "Su", x: 40, y: 53, num: 8 },
    { id: 8, pos: "AMR", name: "Sağ Kanat", role: "Kanat Forvet", duty: "At", x: 82, y: 34, num: 7 },
    { id: 9, pos: "AMC", name: "On Numara", role: "Ofansif Orta Saha", duty: "Su", x: 50, y: 34, num: 10 },
    { id: 10, pos: "AML", name: "Sol Kanat", role: "Ters Ayaklı Kanat", duty: "At", x: 18, y: 34, num: 11 },
    { id: 11, pos: "ST", name: "Santrafor", role: "Sahte Dokuz", duty: "At", x: 50, y: 15, num: 9 }
  ],
  "4-3-3": [
    { id: 1, pos: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", x: 50, y: 82, num: 1 },
    { id: 2, pos: "DR", name: "Sağ Bek", role: "Kanat Bek", duty: "Su", x: 86, y: 70, num: 2 },
    { id: 3, pos: "DC", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", x: 63, y: 74, num: 4 },
    { id: 4, pos: "DC", name: "Sol Stoper", role: "Stoper", duty: "De", x: 37, y: 74, num: 3 },
    { id: 5, pos: "DL", name: "Sol Bek", role: "Kanat Bek", duty: "At", x: 14, y: 70, num: 5 },
    { id: 6, pos: "DM", name: "Ön Libero", role: "Regista", duty: "Su", x: 50, y: 56, num: 6 },
    { id: 7, pos: "MC", name: "Sağ İç", role: "İki Yönlü Orta Saha", duty: "Su", x: 64, y: 43, num: 8 },
    { id: 8, pos: "MC", name: "Sol İç", role: "Mezzala", duty: "At", x: 36, y: 43, num: 10 },
    { id: 9, pos: "AMR", name: "Sağ Kanat", role: "Kanat Forvet", duty: "At", x: 82, y: 26, num: 7 },
    { id: 10, pos: "AML", name: "Sol Kanat", role: "Ters Ayaklı Kanat", duty: "At", x: 18, y: 26, num: 11 },
    { id: 11, pos: "ST", name: "Santrafor", role: "Pres Yapan Forvet", duty: "At", x: 50, y: 14, num: 9 }
  ],
  "4-4-2": [
    { id: 1, pos: "GK", name: "Kaleci", role: "Kaleci", duty: "De", x: 50, y: 82, num: 1 },
    { id: 2, pos: "DR", name: "Sağ Bek", role: "İki Yönlü Bek", duty: "Su", x: 86, y: 70, num: 2 },
    { id: 3, pos: "DC", name: "Sağ Stoper", role: "Stoper", duty: "De", x: 62, y: 74, num: 4 },
    { id: 4, pos: "DC", name: "Sol Stoper", role: "Stoper", duty: "De", x: 38, y: 74, num: 3 },
    { id: 5, pos: "DL", name: "Sol Bek", role: "İki Yönlü Bek", duty: "Su", x: 14, y: 70, num: 5 },
    { id: 6, pos: "MR", name: "Sağ Kanat", role: "Kanat Oyuncusu", duty: "At", x: 84, y: 47, num: 7 },
    { id: 7, pos: "MC", name: "Sağ Orta", role: "Savaşçı Orta Saha", duty: "De", x: 62, y: 49, num: 6 },
    { id: 8, pos: "MC", name: "Sol Orta", role: "Gezgin Oyun Kurucu", duty: "Su", x: 38, y: 49, num: 8 },
    { id: 9, pos: "ML", name: "Sol Kanat", role: "Kanat Oyuncusu", duty: "At", x: 16, y: 47, num: 11 },
    { id: 10, pos: "ST", name: "Sağ Forvet", role: "Hedef Forvet", duty: "Su", x: 60, y: 18, num: 9 },
    { id: 11, pos: "ST", name: "Sol Forvet", role: "Fırsatçı Golcü", duty: "At", x: 40, y: 18, num: 10 }
  ],
  "5-2-3": [
    { id: 1, pos: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", x: 50, y: 82, num: 1 },
    { id: 2, pos: "WBR", name: "Sağ Kanat Bek", role: "Kanat Bek", duty: "At", x: 88, y: 55, num: 2 },
    { id: 3, pos: "DC", name: "Sağ Stoper", role: "Kenar Stoper", duty: "De", x: 68, y: 74, num: 4 },
    { id: 4, pos: "DC", name: "Merkez Stoper", role: "Çakılı Stoper", duty: "De", x: 50, y: 76, num: 5 },
    { id: 5, pos: "DC", name: "Sol Stoper", role: "Kenar Stoper", duty: "De", x: 32, y: 74, num: 3 },
    { id: 6, pos: "WBL", name: "Sol Kanat Bek", role: "Kanat Bek", duty: "At", x: 12, y: 55, num: 6 },
    { id: 7, pos: "MC", name: "Sağ Orta", role: "İki Yönlü Orta Saha", duty: "Su", x: 62, y: 45, num: 8 },
    { id: 8, pos: "MC", name: "Sol Orta", role: "Gezgin Oyun Kurucu", duty: "Su", x: 38, y: 45, num: 10 },
    { id: 9, pos: "AMR", name: "Sağ Forvet", role: "Kanat Forvet", duty: "At", x: 78, y: 24, num: 7 },
    { id: 10, pos: "AML", name: "Sol Forvet", role: "Ters Ayaklı Kanat", duty: "At", x: 22, y: 24, num: 11 },
    { id: 11, pos: "ST", name: "Santrafor", role: "Yaratıcı Forvet", duty: "At", x: 50, y: 15, num: 9 }
  ],
  "3-5-2": [
    { id: 1, pos: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", x: 50, y: 82, num: 1 },
    { id: 2, pos: "DC", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", x: 70, y: 74, num: 4 },
    { id: 3, pos: "DC", name: "Merkez Stoper", role: "Stoper", duty: "De", x: 50, y: 76, num: 5 },
    { id: 4, pos: "DC", name: "Sol Stoper", role: "Pasör Stoper", duty: "De", x: 30, y: 74, num: 3 },
    { id: 5, pos: "WBR", name: "Sağ Kanat Bek", role: "Kanat Bek", duty: "Su", x: 88, y: 50, num: 2 },
    { id: 6, pos: "DM", name: "Ön Libero", role: "Defansif Orta Saha", duty: "De", x: 50, y: 58, num: 6 },
    { id: 7, pos: "WBL", name: "Sol Kanat Bek", role: "Kanat Bek", duty: "Su", x: 12, y: 50, num: 7 },
    { id: 8, pos: "MC", name: "Sağ İç", role: "Mezzala", duty: "At", x: 64, y: 41, num: 8 },
    { id: 9, pos: "MC", name: "Sol İç", role: "Gezgin Oyun Kurucu", duty: "Su", x: 36, y: 41, num: 10 },
    { id: 10, pos: "ST", name: "Sağ Forvet", role: "Pres Yapan Forvet", duty: "At", x: 60, y: 17, num: 9 },
    { id: 11, pos: "ST", name: "Sol Forvet", role: "Yaratıcı Forvet", duty: "Su", x: 40, y: 17, num: 11 }
  ],
  "4-1-2-1-2": [
    { id: 1, pos: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", x: 50, y: 82, num: 1 },
    { id: 2, pos: "DR", name: "Sağ Bek", role: "İki Yönlü Bek", duty: "At", x: 86, y: 68, num: 2 },
    { id: 3, pos: "DC", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", x: 62, y: 74, num: 4 },
    { id: 4, pos: "DC", name: "Sol Stoper", role: "Stoper", duty: "De", x: 38, y: 74, num: 3 },
    { id: 5, pos: "DL", name: "Sol Bek", role: "İki Yönlü Bek", duty: "At", x: 14, y: 68, num: 5 },
    { id: 6, pos: "DM", name: "Ön Libero", role: "Defansif Orta Saha", duty: "De", x: 50, y: 58, num: 6 },
    { id: 7, pos: "MC", name: "Sağ İç", role: "İki Yönlü Orta Saha", duty: "Su", x: 66, y: 45, num: 8 },
    { id: 8, pos: "MC", name: "Sol İç", role: "Mezzala", duty: "Su", x: 34, y: 45, num: 7 },
    { id: 9, pos: "AMC", name: "On Numara", role: "Ofansif Orta Saha", duty: "At", x: 50, y: 32, num: 10 },
    { id: 10, pos: "ST", name: "Sağ Forvet", role: "Fırsatçı Golcü", duty: "At", x: 60, y: 16, num: 9 },
    { id: 11, pos: "ST", name: "Sol Forvet", role: "Sahte Dokuz", duty: "Su", x: 40, y: 16, num: 11 }
  ]
};

const ROLES_BY_POS = {
  "GK": ["Libero Kaleci", "Kaleci"],
  "DR": ["Kanat Bek", "İki Yönlü Bek", "Sahte Bek", "Standart Bek"],
  "DL": ["Kanat Bek", "İki Yönlü Bek", "Sahte Bek", "Standart Bek"],
  "DC": ["Pasör Stoper", "Stoper", "Çakılı Stoper", "Kenar Stoper"],
  "DM": ["Defansif Orta Saha", "Regista", "Savaşçı Orta Saha", "Derin Oyun Kurucu", "Yarım Stoper"],
  "MC": ["Gezgin Oyun Kurucu", "İki Yönlü Orta Saha", "Mezzala", "Savaşçı Orta Saha", "Merkez Orta Saha", "Ofansif Oyun Kurucu"],
  "MR": ["Kanat Oyuncusu", "Ters Ayaklı Kanat", "Çalışkan Kanat"],
  "ML": ["Kanat Oyuncusu", "Ters Ayaklı Kanat", "Çalışkan Kanat"],
  "WBR": ["Kanat Bek", "İki Yönlü Bek"],
  "WBL": ["Kanat Bek", "İki Yönlü Bek"],
  "AMR": ["Kanat Forvet", "Ters Ayaklı Kanat", "Kanat Oyuncusu", "Gizli Forvet"],
  "AML": ["Kanat Forvet", "Ters Ayaklı Kanat", "Kanat Oyuncusu", "Gizli Forvet"],
  "AMC": ["Ofansif Orta Saha", "Gezgin Oyun Kurucu", "On Numara (Enganche)", "Gizli Forvet"],
  "ST": ["Sahte Dokuz", "Yaratıcı Forvet", "Pres Yapan Forvet", "Fırsatçı Golcü", "Hedef Forvet", "Komple Forvet"]
};
