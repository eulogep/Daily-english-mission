# T-0006 — Cartes de flux

Ces cartes définissent les responsabilités attendues. Elles ne déclarent aucun endpoint ou modèle déjà implémenté.

## 1. Démarrer ou reprendre depuis Aujourd’hui

```text
Learner -> Today UI: ouvrir
Today UI -> Learning Planner: demander prochaine action
Learning Planner -> Mission Repository: définition active
Learning Planner -> Attempt Repository: tentative reprenable ?
Attempt Repository --> Learning Planner: tentative ou aucune
Learning Planner --> Today UI: Start/Resume + raison + durée + mode LOCAL_ONLY
Learner -> Today UI: Start/Resume
Today UI -> Mission Use Case: start/resume
Mission Use Case -> Attempt Repository: transition atomique
Mission Use Case --> Mission Runner: view model de l’étape active
```

Échec sûr : si le planner échoue, afficher la dernière tentative reprenable; ne pas démarrer une seconde tentative silencieusement.

## 2. Exécuter et mettre en pause

```text
Mission Runner -> Step Use Case: enregistrer brouillon/temps
Step Use Case -> Attempt Repository: upsert idempotent de l’étape
Learner -> Mission Runner: pause
Mission Runner -> Attempt Use Case: PAUSE(expectedVersion)
Attempt Use Case -> Attempt Repository: état + étape + temps, transaction
Attempt Repository --> UI: confirmation persistée
```

Un conflit de version demande de recharger; il ne doit pas écraser un état plus récent.

## 3. Déposer une preuve locale

```text
Learner -> Evidence UI: sélectionner fichier
Evidence UI -> Upload Route: flux + mission/step IDs
Upload Route -> Validator: taille, type, nom, classification
Validator -> Evidence Store: écriture atomique sous identifiant opaque
Evidence Store --> Upload Route: storageKey + SHA-256 + taille
Upload Route -> Evidence Repository: métadonnées et relations
Evidence Repository --> Evidence UI: reçu sans chemin système
```

Tout échec après l’écriture et avant la métadonnée déclenche la suppression contrôlée du fichier orphelin. Aucun contenu n’est envoyé à un tiers.

## 4. Soumettre, évaluer, faire progresser

```text
Learner -> Attempt Use Case: submit
Attempt Use Case -> Repository: vérifier sorties obligatoires
Attempt Use Case -> Assessment Service: tentative + preuve + grille/version
Assessment Service --> Attempt Use Case: critères + erreurs critiques
Attempt Use Case -> Assessment Repository: résultat
Attempt Use Case -> Competency Ledger: proposition de transition
Competency Ledger -> Repository: append transition justifiée
Attempt Use Case -> Review Scheduler: programmer suite/révision
Attempt Use Case --> Result UI: résultat + preuve + prochaine action
```

La progression est bloquée si la grille, la preuve requise ou la version manque. Un score partiel reste visible sans inventer de transition.

## 5. Excel CSV Foundations Niveau 1

```text
Préparation
 -> démonstration import UTF-8/virgule
 -> action dans Excel
 -> contrôle colonnes/types
 -> identification de l’unique anomalie
 -> sauvegarde locale
 -> dépôt de preuve
 -> explication sans tutoriel
 -> auto-évaluation
 -> grille
 -> prochaine révision ou niveau suivant
```

Le fichier source est `TRAINING_SYNTHETIC`. La démonstration peut être consultée avant l’épreuve; elle est fermée pendant l’explication indépendante. L’answer key ne franchit jamais la frontière serveur-client avant l’évaluation.

## 6. Préparer une opération externe future

```text
UI -> External Operation Gate: source, classification, objectif, prompt, destination
Gate -> Policy: autorisé ?
Policy --> UI: BLOCKED ou AWAITING_HUMAN_APPROVAL
Human -> UI: approbation précise
UI -> Adapter: une exécution bornée
Adapter -> Audit: statut + hash, jamais secret/contenu brut
Adapter --> UI: résultat ou fallback local
```

Ce flux est une frontière future, pas une intégration T-0006.

## 7. Ownership des erreurs

| Erreur | Propriétaire | Comportement UI |
|---|---|---|
| Définition introuvable | mission catalog | action indisponible, référence locale |
| Transition invalide | mission runtime | conserver l’écran et expliquer |
| Persistance échouée | repository/adapter | ne pas annoncer sauvegardé, permettre retry |
| Fichier refusé | upload validator | raison précise sans chemin interne |
| Évaluation indisponible | assessment | preuve conservée, statut en attente |
| Fournisseur externe bloqué | policy gate | fallback local/manual |

