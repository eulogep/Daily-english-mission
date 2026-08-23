export const complexDocumentPilot = {
  sourceId: "ACADEMIC-NETWORK-CH01-001",
  sourceClassification: "ACADEMIC_PERSONAL_USE",
  pages: [
    { pageNumber: 17, reason: "Schéma comparatif OSI / TCP-IP", pdfjsCharacters: 24, doclingTextCharacters: 23, doclingPictures: 1, pdfjsQuality: "LOW", doclingQuality: "MEDIUM" },
    { pageNumber: 20, reason: "Flux d’encapsulation et ordre spatial", pdfjsCharacters: 408, doclingTextCharacters: 327, doclingPictures: 1, pdfjsQuality: "LOW", doclingQuality: "MEDIUM" },
    { pageNumber: 29, reason: "Diagramme d’encapsulation bidirectionnel", pdfjsCharacters: 17, doclingTextCharacters: 16, doclingPictures: 1, pdfjsQuality: "LOW", doclingQuality: "MEDIUM" },
    { pageNumber: 30, reason: "Page mixte liste et illustration", pdfjsCharacters: 590, doclingTextCharacters: 551, doclingPictures: 1, pdfjsQuality: "MEDIUM", doclingQuality: "HIGH" },
  ],
  timingsSeconds: { doclingCold: 90.69, doclingWarmProcess: [72.33, 71.02, 66.04] },
  conclusion: "Docling améliore la détection de structure et signale les figures, mais ne prouve pas la compréhension sémantique des flèches ou relations du diagramme.",
} as const;
