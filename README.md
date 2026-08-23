# Engineer Learning OS — Système d'Apprentissage & de Preuve pour Ingénieur

**Engineer Learning OS** est une plateforme locale, modulaire et orientée preuve, conçue pour structurer l’apprentissage continu, la pratique délibérée et la préparation métier d’un élève-ingénieur en informatique (ESIEA / Alternance Soufflet Malt).

Elle remplace les métriques superficielles (pourcentages arbitraires, badges sans valeur) par un système rigoureux où chaque compétence est déduite d'**activités tracées**, de **documents sources canoniques** et de **preuves reproductibles**.

---

## 🎯 Objectifs Clés

1. **Apprentissage ancré sur documents sources (Grounded Learning)** : extraction de contenu fidèle depuis des supports de cours (PDF, Markdown), quiz basés sur des citations exactes avec pagination et remédiation adaptative ciblée.
2. **Mémoire d'erreurs & Révision espacée** : détection de signaux d'erreur métier récurrents (ex. confusion TCP/UDP, mauvaise gestion de délimiteurs CSV, sur-affirmation dans un rapport) et planification de reprises espacées.
3. **Anglais technique intégré (English-in-the-Loop)** : exercices d'expression orale et écrite avec enregistrement audio local, vérification de vocabulaire technique et limitation stricte des retours (feedback concis).
4. **Scénarios professionnels réalistes** : simulations de cas industriels (ex. analyse d'anomalies de données de production), distinction claire faits vs hypothèses, et traçabilité de l'assistance (autonome vs scaffoldée).
5. **Confidentialité & Local-First absolus** : tout s'exécute en local sans dépendance externe obligatoire ; aucune donnée sensible d'entreprise ou document académique restreint n'est envoyé à des tiers.

---

## 🧱 Architecture du Projet

Le projet adopte une architecture en **monolithe modulaire** avec isolation stricte du domaine métier :

```text
src/
├── app/                          # Couche de présentation & routage Next.js (App Router)
│   ├── learn/                    # Parcours d'apprentissage thématiques
│   ├── subjects/                 # Espace académique multi-matières
│   ├── sources/                  # Explorateur de sources et provenance
│   ├── review/                   # Espace de révision et remédiation
│   ├── evidence/                 # Registre d'audit des preuves
│   └── progress/                 # Matrice de compétences déduite
├── components/                   # Composants d'interface React (shadcn/ui + widgets métier)
│   ├── academic-workspace/       # Composants quiz, visualiseur PDF et remédiation
│   ├── source-engine/            # Cartes de sources et explorateur de catalogue
│   ├── learning-records/         # Visualisation des compétences et preuves
│   └── mission-runtime/          # Moteur d'étapes de mission
├── modules/                      # LOGIQUE MÉTIER PURE (indépendante du framework)
│   ├── academic-workspace/       # Quiz académiques, registre de cours, remédiation
│   ├── source-engine/            # Sources canoniques, provenance, bundles
│   ├── document-extraction/      # Pipeline PDF.js & pont Docling local
│   ├── learning-records/         # Dérivation de compétences & preuves
│   ├── review-engine/            # Détection d'erreurs & planification de révision
│   ├── professional-scenarios/   # Scénarios industriels & validation multidimensionnelle
│   ├── deep-mastery/             # Exercices de maîtrise approfondie (CSV, encodage)
│   ├── technical-english/        # Workflow anglais parlé/écrit & audio evidence
│   └── mission-runtime/          # Moteur d'exécution pas-à-pas & suivi du temps actif
└── shared/ / config/             # Utilitaires stables et configuration validée
```

---

## 🚀 Capacités Opérationnelles Implémentées

| Module | Fonctionnalités | Validation |
|---|---|---|
| **Academic Workspace** | Pilotage multi-matière (Réseaux INF3050 actif), cours sources paginés, quiz à citations vérifiées, remédiation adaptative (explication ciblée, flashcard, révision de section). | ✅ Actif |
| **Source Engine** | Catalogue de sources canoniques vs dérivées, adaptation sécurisée de catalogues, attribution de bundles aux missions. | ✅ Actif |
| **Document Extraction** | Extraction rapide de texte via PDF.js (Apache-2.0), extraction de structures complexes (tableaux/formules) via Docling (MIT) local borné, cache d'extraction local. | ✅ Actif |
| **Review Engine** | Mémorisation des schémas d'erreur, planification de révisions espacées, détection des régressions et résolutions durables. | ✅ Actif |
| **Learning Records** | Registre des preuves d'apprentissage, matrice de compétences (Excel, Anglais, Décision pro, Réseaux) déduite à 100% de preuves auditables. | ✅ Actif |
| **Technical English** | Enregistrement audio local, transcriptions manuelles/assistées, fallback textuel, évaluation de restitution technique. | ✅ Actif |
| **Professional Scenarios** | Scénario d'anomalie de données industrielles, évaluation multidimensionnelle (précision factuelle, prochaine action, sur-affirmation). | ✅ Actif |
| **Deep Mastery** | Déconstruction des modèles mentaux sur les délimiteurs, guillemets et séparateurs décimaux CSV. | ✅ Actif |
| **Mission Runtime** | Moteur d'étapes de mission, persistance locale avec watchdog de réhydratation, exclusion des temps morts d'onglet en arrière-plan. | ✅ Actif |

---

## 🛠️ Pile Technologique

- **Framework Web** : [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)
- **Langage** : [TypeScript 5](https://www.typescriptlang.org/) (mode `bundler` avec support natif des extensions TS pour l'exécution Node)
- **Design & Styles** : [Tailwind CSS 4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) / Radix UI
- **Extraction Documentaire** : [pdfjs-dist](https://github.com/mozilla/pdf.js) (6.2) & [Docling](https://github.com/DS4SD/docling) (2.121 local CLI)
- **Persistance & Données** : [Prisma 6](https://www.prisma.io/) / SQLite & Zustand avec stockage local browser
- **Test Runner** : Node.js native test runner (`node --test --experimental-strip-types`)

---

## 💻 Commandes & Workflow de Développement

### 1. Installation des dépendances
```bash
npm install
```

### 2. Démarrage du serveur de développement
```bash
npm run dev
# Application accessible sur http://localhost:3000
```

### 3. Exécution des tests automatisés
L'ensemble de la suite de tests (unitaires et intégration) s'exécute via le runner natif Node.js :
```bash
node --test --experimental-strip-types tests/unit/**/*.test.ts tests/integration/**/*.test.ts
```
> **Résultat attendu :** 214 tests passants (214/214 PASS).

### 4. Validation TypeScript
```bash
npx tsc --noEmit
```

### 5. Analyse statique (ESLint)
```bash
npm run lint
```

### 6. Build de production (Cross-Platform)
Le script de build Next.js avec assemblage du mode `standalone` est entièrement multiplateforme (Windows, Linux, macOS) :
```bash
npm run build
```

---

## 🗺️ Plan de Navigation de l'Application

- `/` : **Aujourd’hui** — Tableau de bord des priorités et activités du jour
- `/learn` : **Apprendre** — Hub des missions pratiques, deep mastery et scénarios professionnels
- `/subjects` : **Matières** — Espace académique (ex. Réseaux informatiques INF3050, cours paginés et quiz ancrés)
- `/sources` : **Sources** — Catalogue des ressources d'apprentissage, classification et traçabilité de provenance
- `/review` : **Réviser** — Centre de révision espacée et remédiation des erreurs enregistrées
- `/evidence` : **Preuves** — Registre d'audit complet de toutes les tentatives, fichiers et évaluations
- `/progress` : **Progression** — Matrice de compétences basée exclusivement sur les preuves auditables
- `/daily-english` : **Daily English** — Entraînement quotidien à la communication technique orale

---

## 🔒 Principes de Sécurité et de Données

- **Zéro fuite documentaire** : aucun cours académique sous droit, tableur interne ou donnée restreinte n'est commité dans le dépôt public.
- **Fixtures synthétiques** : tous les tests s'appuient strictement sur des données synthétiques déclarées (`TRAINING_SYNTHETIC`).
- **Isolation d'exécution** : les dépendances Python complexes (Docling, OCR) sont exécutées via des bridges locaux bornés (`scripts/document-extraction/`) sans appel réseau externe.
