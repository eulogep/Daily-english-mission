# Modules Métier — Engineer Learning OS

Ce répertoire contient la logique métier pure du système. Chaque module est indépendant du framework web (Next.js), des adaptateurs de persistance directs (Prisma/SQLite) et des fournisseurs d'IA.

---

## 📂 Modules Actifs et Responsabilités

### 1. `academic-workspace/`
- **Rôle** : Gestion de l'espace d'apprentissage académique (matières actives/planifiées, supports de cours, quiz ancrés).
- **Fonctionnalités** : Pilotage du cours Réseaux INF3050, vérification déterministe de citations (`academicPdfQuizIsGrounded`), remédiation adaptative (explication, flashcard conceptuelle, réingestion de section), registre d'extracteurs locaux.

### 2. `source-engine/`
- **Rôle** : Moteur de sources canoniques, traçabilité de la provenance et constitution de bundles de formation.
- **Fonctionnalités** : Définition des schémas de sources (`SourceRecord`, `ConceptRecord`), adaptation de catalogues de formation, association de sources vérifiées aux missions.

### 3. `document-extraction/`
- **Rôle** : Pipeline d'extraction documentaire multi-moteurs 100% local.
- **Fonctionnalités** : Adaptateur PDF.js pour extraction rapide de texte, adaptateur Docling pour documents structurés (tableaux, formules), cache d'extraction local et politique stricte d'OCR pour scans.

### 4. `learning-records/`
- **Rôle** : Registre d'audit des preuves d'apprentissage et dérivation du statut de compétences.
- **Fonctionnalités** : Enregistrement immuable des preuves (`EvidenceRecord`), calcul déterministe des niveaux de compétence (`NOT_SEEN`, `PRACTICED`, `VERIFIED`), suppression des métriques artificielles.

### 5. `review-engine/`
- **Rôle** : Détection des schémas d'erreurs signifiants et planification de la révision espacée.
- **Fonctionnalités** : Capture des signaux d'erreur, regroupement en schémas récurrents (`ErrorPattern`), calcul des prochaines échéances de rappel, évaluation des réponses de révision.

### 6. `professional-scenarios/`
- **Rôle** : Simulation de cas métier industriels guidés et autonomes.
- **Fonctionnalités** : Définition de scénarios (ex. analyse d'anomalies de données), évaluation multidimensionnelle (précision factuelle, prochaine action, sur-affirmation), traçabilité de l'assistance (scaffolding vs autonomie).

### 7. `deep-mastery/`
- **Rôle** : Déconstruction des modèles mentaux erronés et pratique délibérée approfondie.
- **Fonctionnalités** : Exercices ciblés sur les règles fondamentales (ex. délimiteurs CSV, guillemets, formats numériques), validation rigoureuse des acquis.

### 8. `technical-english/`
- **Rôle** : Entraînement à la communication technique en anglais (écrite et parlée).
- **Fonctionnalités** : Enregistrement audio local, liaison avec transcription, évaluation de la restitution technique et restitution de feedback concis (max 3 points).

### 9. `mission-runtime/`
- **Rôle** : Moteur d'exécution pas-à-pas des missions interactives quotidiennes.
- **Fonctionnalités** : Validation des étapes, mesure du temps d'apprentissage effectif (exclusion des temps d'inactivité/onglet masqué), persistance et reprise transparente de session.
