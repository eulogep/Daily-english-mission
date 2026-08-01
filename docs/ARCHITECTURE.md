# Architecture cible

## Statut

Cette architecture est une cible progressive. La création de ses frontières ne signifie pas que les
modules sont implémentés. Daily English Mission reste en place et doit être migré uniquement par tickets
bornés, après traitement des risques identifiés par T-0002.

## Objectifs

L’architecture doit permettre à un seul utilisateur de cataloguer ses ressources, planifier son
apprentissage, pratiquer, produire des preuves, progresser en anglais technique et se préparer à son
alternance, sans exposer automatiquement ses documents ou données personnelles.

Elle privilégie :

- une application locale par défaut ;
- des capacités métier isolées du framework ;
- des intégrations externes remplaçables et dégradables ; NotebookLM est requis comme capacité
  pédagogique, sans devenir un point unique de blocage ;
- une traçabilité des décisions et des preuves ;
- une progression verticale avant l’élargissement fonctionnel.

## Vue d’ensemble

```text
Interface Next.js (`src/app`)
        |
        v
Racine de composition (`src/main`)
        |
        v
Modules métier (`src/modules/*`)
        |
        +--> contrats de persistance
        +--> contrats IA / transcription
        +--> contrats fichiers / audio
        +--> événements et preuves
                 |
                 v
Adaptateurs d’infrastructure (Prisma, SQLite, fournisseurs externes, stockage local)
```

Les dépendances pointent vers le métier. Un module métier ne doit pas importer une route Next.js, un
client Prisma global ou un SDK de fournisseur. La racine de composition assemble les implémentations.

## Modules métier

| Module | Responsabilité | Hors périmètre direct |
| --- | --- | --- |
| `knowledge-catalog` | Métadonnées, provenance et classement des ressources | Déplacement ou publication des documents sources |
| `competency-map` | Concepts, prérequis, compétences et niveaux attendus | Planification quotidienne |
| `learning-planner` | Priorités, charge, calendrier et choix d’activité | Rendu de l’interface |
| `daily-mission` | Cycle de vie d’une mission courte et reprenable | Appels directs à Prisma ou à un fournisseur IA |
| `practice-engine` | Exercices, tentatives, feedback et répétition | Politique globale de maîtrise |
| `english-in-the-loop` | Anglais professionnel intégré aux activités | Transmission implicite de données à un tiers |
| `soufflet-readiness` | Contextes industriels fictifs, UAT et préparation métier | Données confidentielles de l’entreprise |
| `evidence-and-assessment` | Preuves, critères, évaluations et verdicts | Modification des preuves produites |
| `learning-memory` | Historique, reprise, erreurs et consolidation | Secrets et journaux techniques bruts |

## Structure

```text
.
├── AGENTS.md
├── README.md
├── .agent/
│   ├── memory/
│   ├── reports/
│   └── settings/
├── docs/
│   └── ARCHITECTURE.md
├── knowledge/
│   ├── catalog/
│   ├── curricula/
│   ├── alternance/
│   ├── company/
│   ├── generated/notebooklm/
│   ├── open-source/
│   └── evaluations/
├── src/
│   ├── app/                       # application existante / adaptateur Next.js
│   ├── modules/
│   │   ├── knowledge-catalog/
│   │   ├── competency-map/
│   │   ├── learning-planner/
│   │   ├── daily-mission/
│   │   ├── practice-engine/
│   │   ├── english-in-the-loop/
│   │   ├── soufflet-readiness/
│   │   ├── evidence-and-assessment/
│   │   └── learning-memory/
│   ├── shared/
│   ├── config/
│   └── main/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   ├── regression/
│   ├── adversarial/
│   └── held-out/
└── scripts/
    ├── inventory/
    ├── import/
    ├── verification/
    ├── backup/
    └── rollback/
```

Les autres documents prévus par le prompt maître seront créés lorsque leur ticket produira un contenu
réel. Les futurs rapports ne sont pas précréés afin de ne pas donner l’impression qu’un audit a eu lieu.

## Anatomie recommandée d’un module

Lorsqu’un module reçoit sa première fonctionnalité, il peut adopter progressivement cette structure :

```text
module/
├── domain/          # entités, valeurs, règles et événements purs
├── application/     # cas d’usage et ports
├── infrastructure/  # adaptateurs Prisma, fichiers ou fournisseurs
├── presentation/    # modèles de vue propres au module si nécessaire
└── index.ts          # API publique explicite
```

Il ne faut pas créer ces sous-dossiers avant un cas d’usage réel.

## Données et confidentialité

- Les documents académiques restent à leur emplacement d’origine.
- Le catalogue conserve des métadonnées et chemins relatifs ou abstraits, pas les contenus par défaut.
- Les données Soufflet utilisées pour apprendre ou tester doivent être fictives ou explicitement
  autorisées et désensibilisées.
- Les audios, transcriptions et corrections ont une politique explicite de consentement, rétention,
  export et suppression avant toute extension de leur stockage.
- Les bases locales, audios, journaux et secrets restent ignorés par Git.

## Intégrations

Les interfaces vers l’IA, la transcription, NotebookLM, le stockage et le déploiement sont des ports.
Chaque adaptateur doit déclarer les données sortantes, ses limites, ses délais, son coût potentiel et son
comportement de repli. Aucun fournisseur ne constitue une dépendance du domaine.

NotebookLM est une capacité pédagogique obligatoire de l’architecture cible. L’automatisation locale
Patchright/Chrome échoue à la conformité sécurité mais reste conditionnellement autorisée pendant le
prototype, après approbation humaine explicite pour chaque opération. L’exécution non supervisée est
interdite. `MANUAL_ASSISTED_NOTEBOOKLM` est le fallback obligatoire ; en cas de
`NOTEBOOKLM_UNAVAILABLE`, la mission continue avec une activité locale équivalente. T-0003B définit
`SourceBundle`, prompts, artefacts, confirmations et traçabilité. T-0003C durcit le legacy et un
connecteur de remplacement sûr reste obligatoire.

## Tests

- `unit` : règles métier pures ;
- `integration` : adaptateurs sur bases et fichiers temporaires ;
- `e2e` : parcours utilisateur critique ;
- `security` : accès, validation, limites et exposition ;
- `regression` : incidents et comportements corrigés ;
- `adversarial` : entrées malveillantes, prompt injection et abus ;
- `held-out` : évaluations non utilisées pendant la construction.

Tous les tests emploient des données synthétiques. Les appels réseau sont remplacés par des doubles sauf
autorisation explicite d’un test contrôlé.

## Migration progressive de Daily English Mission

1. Sécuriser les accès, la confidentialité, Caddy et le traitement des erreurs.
2. Stabiliser le gestionnaire de paquets, TypeScript, Prisma et les migrations.
3. Extraire un cas d’usage court de mission quotidienne avec ses ports et tests.
4. Brancher les routes Next.js et Prisma comme adaptateurs de ce cas d’usage.
5. Ajouter reprise, historique, suppression et export.
6. Valider l’usage réel avant d’ouvrir les autres modules.

Le code existant n’est pas déplacé en masse. Chaque extraction doit conserver le comportement vérifié et
avoir une stratégie de retour arrière.

## Décisions différées

- stratégie d’authentification locale ou derrière tunnel ;
- format définitif des identifiants et relations du modèle de données ;
- fournisseur ou solution locale de transcription ;
- politique de sauvegarde et chiffrement ;
- choix du connecteur NotebookLM sûr après T-0003B/T-0003C, sans remettre en cause son rôle requis ;
- choix de déploiement après suppression des chemins et proxys dangereux.
