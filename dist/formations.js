/**
 * FM Tactic Studio & Universal Scout - Canonical FM 26 / FM 27 Fixed Slot Grid & Formations
 */
const FIXED_TACTICAL_SLOTS = {
    // Goalkeeper (1)
    "GK": { slotId: "GK", pos: "GK", label: "Kaleci", defaultRole: "Libero Kaleci", defaultDuty: "De", x: 50, y: 84 },
    // Defensive Line (5)
    "DL": { slotId: "DL", pos: "DL", label: "Sol Bek", defaultRole: "İki Yönlü Bek", defaultDuty: "Su", x: 14, y: 71 },
    "DCL": { slotId: "DCL", pos: "DC", label: "Sol Stoper", defaultRole: "Stoper", defaultDuty: "De", x: 34, y: 73 },
    "DC": { slotId: "DC", pos: "DC", label: "Merkez Stoper", defaultRole: "Çakılı Stoper", defaultDuty: "De", x: 50, y: 74 },
    "DCR": { slotId: "DCR", pos: "DC", label: "Sağ Stoper", defaultRole: "Pasör Stoper", defaultDuty: "De", x: 66, y: 73 },
    "DR": { slotId: "DR", pos: "DR", label: "Sağ Bek", defaultRole: "Kanat Bek", defaultDuty: "Su", x: 86, y: 71 },
    // Defensive Midfield / Wing Back Line (5)
    "WBL": { slotId: "WBL", pos: "WBL", label: "Sol Kanat Bek", defaultRole: "Kanat Bek", defaultDuty: "At", x: 14, y: 56 },
    "DMCL": { slotId: "DMCL", pos: "DM", label: "Sol DOS", defaultRole: "Gezgin Oyun Kurucu", defaultDuty: "Su", x: 35, y: 57 },
    "DMC": { slotId: "DMC", pos: "DM", label: "Ön Libero", defaultRole: "Defansif Orta Saha", defaultDuty: "De", x: 50, y: 58 },
    "DMCR": { slotId: "DMCR", pos: "DM", label: "Sağ DOS", defaultRole: "Defansif Orta Saha", defaultDuty: "De", x: 65, y: 57 },
    "WBR": { slotId: "WBR", pos: "WBR", label: "Sağ Kanat Bek", defaultRole: "Kanat Bek", defaultDuty: "At", x: 86, y: 56 },
    // Central Midfield Line (5)
    "ML": { slotId: "ML", pos: "ML", label: "Sol Orta Saha", defaultRole: "Kanat Oyuncusu", defaultDuty: "At", x: 14, y: 43 },
    "MCL": { slotId: "MCL", pos: "MC", label: "Sol İç Orta", defaultRole: "Mezzala", defaultDuty: "At", x: 34, y: 44 },
    "MC": { slotId: "MC", pos: "MC", label: "Merkez Orta", defaultRole: "Merkez Orta Saha", defaultDuty: "Su", x: 50, y: 45 },
    "MCR": { slotId: "MCR", pos: "MC", label: "Sağ İç Orta", defaultRole: "İki Yönlü Orta Saha", defaultDuty: "Su", x: 66, y: 44 },
    "MR": { slotId: "MR", pos: "MR", label: "Sağ Orta Saha", defaultRole: "Kanat Oyuncusu", defaultDuty: "At", x: 86, y: 43 },
    // Attacking Midfield Line (5)
    "AML": { slotId: "AML", pos: "AML", label: "Sol Kanat", defaultRole: "Ters Ayaklı Kanat", defaultDuty: "At", x: 16, y: 29 },
    "AMCL": { slotId: "AMCL", pos: "AMC", label: "Sol OOS", defaultRole: "Ofansif Orta Saha", defaultDuty: "At", x: 35, y: 30 },
    "AMC": { slotId: "AMC", pos: "AMC", label: "On Numara", defaultRole: "Ofansif Orta Saha", defaultDuty: "Su", x: 50, y: 30 },
    "AMCR": { slotId: "AMCR", pos: "AMC", label: "Sağ OOS", defaultRole: "Gizli Forvet", defaultDuty: "At", x: 65, y: 30 },
    "AMR": { slotId: "AMR", pos: "AMR", label: "Sağ Kanat", defaultRole: "Kanat Forvet", defaultDuty: "At", x: 84, y: 29 },
    // Striker Line (3)
    "STCL": { slotId: "STCL", pos: "ST", label: "Sol Santrafor", defaultRole: "Yaratıcı Forvet", defaultDuty: "Su", x: 35, y: 15 },
    "STC": { slotId: "STC", pos: "ST", label: "Santrafor", defaultRole: "Pres Yapan Forvet", defaultDuty: "At", x: 50, y: 14 },
    "STCR": { slotId: "STCR", pos: "ST", label: "Sağ Santrafor", defaultRole: "Fırsatçı Golcü", defaultDuty: "At", x: 65, y: 15 }
};
function buildFormationFromSlots(items) {
    return items.map((item) => {
        const slot = FIXED_TACTICAL_SLOTS[item.slotId] || FIXED_TACTICAL_SLOTS["MC"];
        return {
            id: item.id,
            slotId: slot.slotId,
            pos: slot.pos,
            name: item.name,
            role: item.role,
            duty: item.duty,
            x: slot.x,
            y: slot.y,
            num: item.num
        };
    });
}
const FORMATIONS = {
    "4-2-3-1": buildFormationFromSlots([
        { id: 1, slotId: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", num: 1 },
        { id: 2, slotId: "DR", name: "Sağ Bek", role: "Kanat Bek", duty: "Su", num: 2 },
        { id: 3, slotId: "DCR", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", num: 4 },
        { id: 4, slotId: "DCL", name: "Sol Stoper", role: "Stoper", duty: "De", num: 3 },
        { id: 5, slotId: "DL", name: "Sol Bek", role: "İki Yönlü Bek", duty: "At", num: 5 },
        { id: 6, slotId: "DMCR", name: "Sağ DOS", role: "Defansif Orta Saha", duty: "De", num: 6 },
        { id: 7, slotId: "DMCL", name: "Sol DOS", role: "Gezgin Oyun Kurucu", duty: "Su", num: 8 },
        { id: 8, slotId: "AMR", name: "Sağ Kanat", role: "Kanat Forvet", duty: "At", num: 7 },
        { id: 9, slotId: "AMC", name: "On Numara", role: "Ofansif Orta Saha", duty: "Su", num: 10 },
        { id: 10, slotId: "AML", name: "Sol Kanat", role: "Ters Ayaklı Kanat", duty: "At", num: 11 },
        { id: 11, slotId: "STC", name: "Santrafor", role: "Sahte Dokuz", duty: "At", num: 9 }
    ]),
    "4-3-3": buildFormationFromSlots([
        { id: 1, slotId: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", num: 1 },
        { id: 2, slotId: "DR", name: "Sağ Bek", role: "Kanat Bek", duty: "Su", num: 2 },
        { id: 3, slotId: "DCR", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", num: 4 },
        { id: 4, slotId: "DCL", name: "Sol Stoper", role: "Stoper", duty: "De", num: 3 },
        { id: 5, slotId: "DL", name: "Sol Bek", role: "Kanat Bek", duty: "At", num: 5 },
        { id: 6, slotId: "DMC", name: "Ön Libero", role: "Regista", duty: "Su", num: 6 },
        { id: 7, slotId: "MCR", name: "Sağ İç", role: "İki Yönlü Orta Saha", duty: "Su", num: 8 },
        { id: 8, slotId: "MCL", name: "Sol İç", role: "Mezzala", duty: "At", num: 10 },
        { id: 9, slotId: "AMR", name: "Sağ Kanat", role: "Kanat Forvet", duty: "At", num: 7 },
        { id: 10, slotId: "AML", name: "Sol Kanat", role: "Ters Ayaklı Kanat", duty: "At", num: 11 },
        { id: 11, slotId: "STC", name: "Santrafor", role: "Pres Yapan Forvet", duty: "At", num: 9 }
    ]),
    "4-4-2": buildFormationFromSlots([
        { id: 1, slotId: "GK", name: "Kaleci", role: "Kaleci", duty: "De", num: 1 },
        { id: 2, slotId: "DR", name: "Sağ Bek", role: "İki Yönlü Bek", duty: "Su", num: 2 },
        { id: 3, slotId: "DCR", name: "Sağ Stoper", role: "Stoper", duty: "De", num: 4 },
        { id: 4, slotId: "DCL", name: "Sol Stoper", role: "Stoper", duty: "De", num: 3 },
        { id: 5, slotId: "DL", name: "Sol Bek", role: "İki Yönlü Bek", duty: "Su", num: 5 },
        { id: 6, slotId: "MR", name: "Sağ Kanat", role: "Kanat Oyuncusu", duty: "At", num: 7 },
        { id: 7, slotId: "MCR", name: "Sağ Orta", role: "Savaşçı Orta Saha", duty: "De", num: 6 },
        { id: 8, slotId: "MCL", name: "Sol Orta", role: "Gezgin Oyun Kurucu", duty: "Su", num: 8 },
        { id: 9, slotId: "ML", name: "Sol Kanat", role: "Kanat Oyuncusu", duty: "At", num: 11 },
        { id: 10, slotId: "STCR", name: "Sağ Forvet", role: "Hedef Forvet", duty: "Su", num: 9 },
        { id: 11, slotId: "STCL", name: "Sol Forvet", role: "Fırsatçı Golcü", duty: "At", num: 10 }
    ]),
    "5-2-3": buildFormationFromSlots([
        { id: 1, slotId: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", num: 1 },
        { id: 2, slotId: "WBR", name: "Sağ Kanat Bek", role: "Kanat Bek", duty: "At", num: 2 },
        { id: 3, slotId: "DCR", name: "Sağ Stoper", role: "Kenar Stoper", duty: "De", num: 4 },
        { id: 4, slotId: "DC", name: "Merkez Stoper", role: "Çakılı Stoper", duty: "De", num: 5 },
        { id: 5, slotId: "DCL", name: "Sol Stoper", role: "Kenar Stoper", duty: "De", num: 3 },
        { id: 6, slotId: "WBL", name: "Sol Kanat Bek", role: "Kanat Bek", duty: "At", num: 6 },
        { id: 7, slotId: "MCR", name: "Sağ Orta", role: "İki Yönlü Orta Saha", duty: "Su", num: 8 },
        { id: 8, slotId: "MCL", name: "Sol Orta", role: "Gezgin Oyun Kurucu", duty: "Su", num: 10 },
        { id: 9, slotId: "AMR", name: "Sağ Forvet", role: "Kanat Forvet", duty: "At", num: 7 },
        { id: 10, slotId: "AML", name: "Sol Forvet", role: "Ters Ayaklı Kanat", duty: "At", num: 11 },
        { id: 11, slotId: "STC", name: "Santrafor", role: "Yaratıcı Forvet", duty: "At", num: 9 }
    ]),
    "3-5-2": buildFormationFromSlots([
        { id: 1, slotId: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", num: 1 },
        { id: 2, slotId: "DCR", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", num: 4 },
        { id: 3, slotId: "DC", name: "Merkez Stoper", role: "Stoper", duty: "De", num: 5 },
        { id: 4, slotId: "DCL", name: "Sol Stoper", role: "Pasör Stoper", duty: "De", num: 3 },
        { id: 5, slotId: "WBR", name: "Sağ Kanat Bek", role: "Kanat Bek", duty: "Su", num: 2 },
        { id: 6, slotId: "DMC", name: "Ön Libero", role: "Defansif Orta Saha", duty: "De", num: 6 },
        { id: 7, slotId: "WBL", name: "Sol Kanat Bek", role: "Kanat Bek", duty: "Su", num: 7 },
        { id: 8, slotId: "MCR", name: "Sağ İç", role: "Mezzala", duty: "At", num: 8 },
        { id: 9, slotId: "MCL", name: "Sol İç", role: "Gezgin Oyun Kurucu", duty: "Su", num: 10 },
        { id: 10, slotId: "STCR", name: "Sağ Forvet", role: "Pres Yapan Forvet", duty: "At", num: 9 },
        { id: 11, slotId: "STCL", name: "Sol Forvet", role: "Yaratıcı Forvet", duty: "Su", num: 11 }
    ]),
    "4-1-2-1-2": buildFormationFromSlots([
        { id: 1, slotId: "GK", name: "Kaleci", role: "Libero Kaleci", duty: "De", num: 1 },
        { id: 2, slotId: "DR", name: "Sağ Bek", role: "İki Yönlü Bek", duty: "At", num: 2 },
        { id: 3, slotId: "DCR", name: "Sağ Stoper", role: "Pasör Stoper", duty: "De", num: 4 },
        { id: 4, slotId: "DCL", name: "Sol Stoper", role: "Stoper", duty: "De", num: 3 },
        { id: 5, slotId: "DL", name: "Sol Bek", role: "İki Yönlü Bek", duty: "At", num: 5 },
        { id: 6, slotId: "DMC", name: "Ön Libero", role: "Defansif Orta Saha", duty: "De", num: 6 },
        { id: 7, slotId: "MCR", name: "Sağ İç", role: "İki Yönlü Orta Saha", duty: "Su", num: 8 },
        { id: 8, slotId: "MCL", name: "Sol İç", role: "Mezzala", duty: "Su", num: 7 },
        { id: 9, slotId: "AMC", name: "On Numara", role: "Ofansif Orta Saha", duty: "At", num: 10 },
        { id: 10, slotId: "STCR", name: "Sağ Forvet", role: "Fırsatçı Golcü", duty: "At", num: 9 },
        { id: 11, slotId: "STCL", name: "Sol Forvet", role: "Sahte Dokuz", duty: "Su", num: 11 }
    ])
};
const ROLES_BY_POS = {
    "GK": ["Libero Kaleci", "Kaleci"],
    "DR": ["Kanat Bek", "İki Yönlü Bek", "Sahte Bek", "Standart Bek"],
    "DL": ["Kanat Bek", "İki Yönlü Bek", "Sahte Bek", "Standart Bek"],
    "DC": ["Pasör Stoper", "Stoper", "Çakılı Stoper", "Kenar Stoper"],
    "DM": ["Defansif Orta Saha", "Regista", "Savaşçı Orta Saha", "Gezgin Oyun Kurucu", "Derin Oyun Kurucu", "Yarım Stoper"],
    "MC": ["Gezgin Oyun Kurucu", "İki Yönlü Orta Saha", "Mezzala", "Savaşçı Orta Saha", "Merkez Orta Saha", "Ofansif Oyun Kurucu"],
    "MR": ["Kanat Oyuncusu", "Ters Ayaklı Kanat", "Çalışkan Kanat"],
    "ML": ["Kanat Oyuncusu", "Ters Ayaklı Kanat", "Çalışkan Kanat"],
    "WBR": ["Kanat Bek", "İki Yönlü Bek", "Ters Ayaklı Kanat Bek"],
    "WBL": ["Kanat Bek", "İki Yönlü Bek", "Ters Ayaklı Kanat Bek"],
    "AMR": ["Kanat Forvet", "Ters Ayaklı Kanat", "Kanat Oyuncusu", "Gizli Forvet"],
    "AML": ["Kanat Forvet", "Ters Ayaklı Kanat", "Kanat Oyuncusu", "Gizli Forvet"],
    "AMC": ["Ofansif Orta Saha", "Gezgin Oyun Kurucu", "On Numara (Enganche)", "Gizli Forvet"],
    "ST": ["Sahte Dokuz", "Yaratıcı Forvet", "Pres Yapan Forvet", "Fırsatçı Golcü", "Hedef Forvet", "Komple Forvet"]
};
