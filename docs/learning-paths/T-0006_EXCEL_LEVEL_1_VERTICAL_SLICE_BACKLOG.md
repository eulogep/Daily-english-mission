# T-0006 — Backlog du vertical slice Excel CSV Niveau 1

Ce backlog prépare T-0007 à T-0009. Il ne lance pas le parcours et ne copie aucune production personnelle.

## 1. Outcome

Sur un nouveau CSV synthétique de huit lignes, l’apprenant importe le fichier avec UTF-8 et virgule, vérifie les colonnes, trouve l’anomalie prévue, sauvegarde le résultat et explique les étapes sans tutoriel.

## 2. Definition of Ready

- support T-0005 vérifié mais answer key isolé;
- définition de mission versionnée et identifiant stable;
- critères de réussite et assistance formalisés;
- stockage de preuve disponible ou preuve temporaire explicitement locale;
- jeu de données `TRAINING_SYNTHETIC`, sans personne ni entreprise;
- test Excel sur la version réellement utilisée par l’apprenant;
- rollback et nettoyage des fixtures documentés.

## 3. Stories ordonnées

| ID | Ticket | Story | Critères d’acceptation | Dépendances |
|---|---|---|---|---|
| VS-01 | T-0007 | Voir la prochaine mission sur Aujourd’hui | objectif, durée, raison, Start/Resume, `LOCAL_ONLY` | shell |
| VS-02 | T-0007 | Ouvrir la fiche de mission | outil, données, aide, preuve visibles | navigation |
| VS-03 | T-0008 | Démarrer/reprendre une tentative | une seule tentative active, version, temps, refresh | modèle runtime |
| VS-04 | T-0008 | Afficher instruction/démonstration/action externe | état et validation de chaque type | composants de pas |
| VS-05 | T-0008 | Mettre en pause | étape/temps persistés, confirmation après écriture | cas d’usage pause |
| VS-06 | T-0009 | Fournir le CSV huit lignes | UTF-8, virgule, exactement une anomalie documentée | fixture T-0005 |
| VS-07 | T-0009 | Guider l’import Excel | sélection UTF-8/virgule et prévisualisation | contenu pédagogique |
| VS-08 | T-0009 | Contrôler colonnes et types | checklist explicite, erreur actionnable | runtime |
| VS-09 | T-0009 | Déposer ou référencer la preuve locale | nom neutralisé, hash, aucune sortie réseau | fondation preuve minimale |
| VS-10 | T-0009 | Expliquer sans tutoriel | support fermé, réponse enregistrée séparément | étape short answer |
| VS-11 | T-0009 | S’auto-évaluer | difficulté, confiance, blocage, réussite, aide, temps | modèle tentative |
| VS-12 | T-0009 | Voir le résultat | critères, erreur critique, assistance, prochaine action | grille locale |
| VS-13 | T-0009 | Passer un held-out court | nouveau fichier, sans procédure détaillée | succès VS-06..12 |

## 4. Contrat de mission candidat

```text
slug: excel-csv-foundations-level-1
version: 1
classification: TRAINING_SYNTHETIC
estimatedMinutes: 20
networkRequired: false
steps:
  prepare
  demonstrate-import
  guided-import
  verify-structure
  submit-evidence
  explain-without-guide
  self-assess
  result
```

Ce bloc est une spécification, pas un fichier de runtime. T-0008 décidera le format validé définitif.

## 5. Grille minimale

| Critère | Succès | Erreur critique |
|---|---|---|
| Import | colonnes distinctes avec virgule | tout reste dans une colonne |
| Encodage | caractères lisibles/UTF-8 | données altérées |
| Structure | en-tête et nombre de colonnes corrects | colonnes déplacées/perdues |
| Anomalie | unique anomalie signalée | anomalie inventée ou ignorée |
| Sauvegarde | fichier local ouvrable | absence/perte de fichier |
| Explication | étapes restituées sans support | tutoriel lu pendant la preuve |

## 6. Test utilisateur T-0009

- Observer sans corriger pendant la tentative indépendante.
- Enregistrer temps par étape, indices, interruptions et fatigue.
- Utiliser un fichier held-out distinct et des anomalies différentes.
- Vérifier que l’utilisateur peut expliquer le délimiteur et la prévisualisation.
- Ne jamais exposer l’answer key avant la soumission.

## 7. Hors périmètre du vertical slice

Moyennes par site, nettoyage Niveau 2, moteur général de compétence, Power BI/SQL/Python, NotebookLM, transcription, outils open source tiers et données d’entreprise.

## 8. Kill criteria

Arrêter T-0009 si : preuve personnelle apparaît dans Git, answer key dans le bundle client, import nécessite une dépendance/cloud non approuvé, reprise perd la tentative, dataset contient une donnée non synthétique ou l’application legacy régresse.

