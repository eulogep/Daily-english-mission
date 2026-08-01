# Intégration contrôlée de NotebookLM

## Statut du document

```text
T-0003B
POLICY_DEFINED
MANUAL_ENFORCEMENT_REQUIRED
POLICY_ENFORCED_BY_CODE = NO
NOTEBOOKLM_EXECUTED_DURING_DESIGN = NO
```

Ce document définit le contrat cible. Il ne crée ni connecteur, ni route, ni automatisation et ne rend
pas les règles techniquement exécutoires. Tant que les contrôles ne sont pas codés et testés, leur respect
repose sur l’utilisateur et l’agent qui prépare l’opération.

## Principes invariants

- NotebookLM est une capacité pédagogique requise, jamais la fin d’une mission.
- `MANUAL_ASSISTED` est le mode par défaut et le fallback obligatoire.
- Une opération ne transmet qu’un `SourceBundle` limité, immuable après approbation.
- Aucune transition ne saute l’approbation humaine.
- Une classification inconnue ou interdite bloque le transfert.
- Toute modification après approbation invalide celle-ci.
- Chaque artefact est suivi d’une activité active et d’une preuve.
- Une indisponibilité NotebookLM ne bloque jamais la mission.
- La skill legacy reste non conforme et seulement conditionnellement autorisée.

## Modes d’intégration

| Mode | Statut | Responsable du transfert | Gate | Usage |
| --- | --- | --- | --- | --- |
| `MANUAL_ASSISTED` | `APPROVED`, `DEFAULT_MODE` | Utilisateur | Préparation et contrôle avant instructions | Mode courant et secours |
| `LEGACY_CONTROLLED` | `CONDITIONALLY_ALLOWED` | Skill legacy, après autorisation | Approbation explicite obligatoire | Future exécution contrôlée, jamais pendant T-0003B |
| `SEMI_AUTOMATED` | `TARGET_DESIGN`, `NOT_IMPLEMENTED` | Futur adaptateur | Aperçu, approbation, transfert limité, journalisation | Cible intermédiaire |
| `OFFICIAL_CONNECTOR` | `PREFERRED_LONG_TERM`, `NOT_ASSUMED_AVAILABLE` | Connecteur audité | Permissions minimales et révocables | Remplacement sûr requis à terme |

### `MANUAL_ASSISTED`

Engineer Learning OS prépare les sources, le nom proposé du notebook, le prompt, l’artefact recommandé,
les instructions et l’activité active suivante. L’utilisateur réalise lui-même les actions dans
NotebookLM. Aucune commande de la skill n’est lancée.

### `LEGACY_CONTROLLED`

Le système prépare une opération complète, mais ne peut la lancer qu’après le passage :

```text
WAITING_FOR_HUMAN_APPROVAL
→ HUMAN_APPROVED
→ EXECUTION_ALLOWED
```

L’approbation vaut uniquement pour le bundle, le prompt, l’artefact, la destination et l’action affichés.
Elle n’autorise aucune sélection supplémentaire, action en arrière-plan ou opération suivante.

### `SEMI_AUTOMATED`

Le futur mode devra préparer automatiquement le bundle, l’afficher intégralement, recueillir
l’approbation, transférer uniquement les éléments approuvés, récupérer un résultat référencé, conserver
une trace expurgée et déclencher l’activité active.

### `OFFICIAL_CONNECTOR`

Un connecteur officiel ou approuvé ne peut être adopté qu’après audit de sa documentation, de son
authentification, de ses permissions, de son stockage, de sa révocation et de sa suppression. Sa
disponibilité n’est pas supposée.

## Modèle `SourceBundle`

```text
SourceBundle
id
title
mission_id
learning_objective
target_competency
selected_sources
source_roles
confidentiality_level
language
expected_artifact
maximum_scope
total_file_count
total_size_bytes
created_by
approved_by
approval_status
created_at
expires_at
```

### Source sélectionnée

Chaque entrée de `selected_sources` doit exposer avant approbation :

```text
relative_name
media_type
extension
size_bytes
role
classification
checksum
exists
sensitive_pattern_status
```

Le chemin affiché doit être relatif ou abstrait. Le contenu complet n’est jamais copié dans les traces.

### Rôles autorisés

```text
PRIMARY_COURSE
OFFICIAL_DOCUMENTATION
EXERCISE
CORRECTION
SUPPLEMENTARY_EXPLANATION
PUBLIC_COMPANY_SOURCE
TRAINING_SYNTHETIC
PERSONAL_NOTES_APPROVED
```

### Statuts d’approbation

```text
DRAFT
CLASSIFICATION_REQUIRED
WAITING_FOR_HUMAN_APPROVAL
HUMAN_APPROVED
REJECTED
EXPIRED
```

### Invariants du bundle

- `total_file_count` correspond exactement au nombre de sources affichées.
- `total_size_bytes` est la somme des tailles affichées.
- `maximum_scope` fixe le nombre et la taille maximum autorisés pour cette opération.
- Toutes les sources existent et ont un checksum avant approbation.
- Toutes les classifications sont connues et compatibles entre elles.
- `approved_by` reste vide avant `HUMAN_APPROVED`.
- `expires_at` est obligatoire avant approbation.
- Un bundle expiré revient à `WAITING_FOR_HUMAN_APPROVAL` après nouvelle vérification.
- Tout changement de source, rôle, classification, prompt, artefact, mode ou destination invalide
  l’approbation.

## Modèle `NotebookLMTask`

```text
NotebookLMTask
id
mission_id
source_bundle_id
learning_objective
artifact_type
generation_prompt
transfer_mode
transfer_status
notebook_reference
artifact_reference
active_followup_required
followup_activity
created_at
approved_at
completed_at
```

### Types d’artefacts

```text
QUIZ
FLASHCARDS
STUDY_GUIDE
FAQ
MIND_MAP
AUDIO_OVERVIEW
VIDEO_OVERVIEW
SLIDE_DECK
BRIEFING
GLOSSARY
CUSTOM_REPORT
```

### Modes de transfert

```text
MANUAL_ASSISTED
LEGACY_CONTROLLED
SEMI_AUTOMATED
OFFICIAL_CONNECTOR
```

### Statuts de transfert

```text
PREPARED
CLASSIFICATION_REQUIRED
WAITING_FOR_HUMAN_APPROVAL
HUMAN_APPROVED
EXECUTION_ALLOWED
TRANSFERRED
GENERATED
RETRIEVED
FAILED
CANCELLED
EXPIRED
```

### Transitions autorisées

```text
PREPARED
→ WAITING_FOR_HUMAN_APPROVAL
→ HUMAN_APPROVED
→ EXECUTION_ALLOWED
→ TRANSFERRED
→ GENERATED
→ RETRIEVED
```

Branches :

```text
PREPARED → CLASSIFICATION_REQUIRED
WAITING_FOR_HUMAN_APPROVAL → CANCELLED
HUMAN_APPROVED → EXPIRED
EXECUTION_ALLOWED → FAILED
```

`EXECUTION_ALLOWED` représente une autorisation ponctuelle, pas une permission persistante. Le mode
manuel peut conserver les mêmes états pour tracer la validation, mais l’action est réalisée par
l’utilisateur. Aucune transition ne peut sauter `HUMAN_APPROVED`.

## Classification des données

### Autorisées

```text
PUBLIC
TRAINING_SYNTHETIC
ACADEMIC_PERSONAL_USE
PERSONAL_APPROVED
```

### Interdites

```text
COMPANY_INTERNAL
COMPANY_RESTRICTED
SECRETS
CREDENTIALS
HEALTH_DATA
FINANCIAL_DATA
ID_DOCUMENTS
PRIVATE_AUDIO_WITHOUT_APPROVAL
UNKNOWN
```

Règles de blocage :

```text
UNKNOWN → DATA_CLASSIFICATION_REQUIRED → TRANSFER_BLOCKED
COMPANY_INTERNAL → DATA_POLICY_BLOCKED
COMPANY_RESTRICTED → DATA_POLICY_BLOCKED
SENSITIVE_PATTERN_DETECTED → HUMAN_REVIEW_REQUIRED
```

Pour une mission Soufflet, seules `PUBLIC` et `TRAINING_SYNTHETIC` sont admissibles. Aucun contenu
interne réel de Soufflet Malt ne peut entrer dans un bundle NotebookLM.

## Pré-vérification des sources

Avant `WAITING_FOR_HUMAN_APPROVAL`, vérifier ou faire vérifier :

- existence ;
- type MIME, extension et taille ;
- rôle et classification ;
- checksum ;
- nombre total et taille totale ;
- présence indicative de secrets, données personnelles ou mentions professionnelles.

Motifs indicatifs :

```text
password
passwd
api_key
apikey
secret
token
BEGIN PRIVATE KEY
CONFIDENTIAL
INTERNAL ONLY
RESTRICTED
Soufflet internal
```

Une détection ne supprime, ne renomme et ne modifie jamais le fichier. Elle suspend la préparation avec
`SENSITIVE_PATTERN_DETECTED` et `HUMAN_REVIEW_REQUIRED`.

## Gate d’approbation

L’écran ou le document d’approbation présente exactement l’opération complète :

```text
Opération NotebookLM préparée

Objectif pédagogique : [objectif]
Compétence ciblée : [compétence]
Mode : [mode]

Sources :
- nom relatif
- type
- taille
- rôle
- classification
- checksum abrégé

Nombre de sources : [nombre]
Taille totale : [taille]
Destination : NotebookLM
Artefact demandé : [type]
Prompt qui sera utilisé : [prompt complet]
Activité obligatoire après génération : [activité]
Risques connus : [risques]

Actions : [APPROUVER] [MODIFIER] [ANNULER]
```

L’ajout/remplacement d’une source ou tout changement de prompt, artefact, mode, destination ou
classification produit :

```text
APPROVAL_INVALIDATED
WAITING_FOR_HUMAN_APPROVAL
```

Sans confirmation explicite : `EXECUTION_BLOCKED_NO_APPROVAL`.

## Recommandation d’artefact

| Besoin | Recommandations |
| --- | --- |
| Compréhension initiale | `STUDY_GUIDE`, `VIDEO_OVERVIEW`, `SLIDE_DECK` |
| Mémorisation | `QUIZ`, `FLASHCARDS` |
| Structure complexe | `MIND_MAP`, `FAQ` |
| Préparation orale | `SLIDE_DECK`, `BRIEFING`, `GLOSSARY` |
| Compréhension orale en anglais | `AUDIO_OVERVIEW`, `GLOSSARY`, `QUIZ` |
| Comparaison de documents | `FAQ`, `CUSTOM_REPORT`, `STUDY_GUIDE` |

La recommandation est explicable et modifiable. Un remplacement invalide une approbation déjà donnée.

## Activité active obligatoire

`active_followup_required` vaut toujours `true`. Sans activité : `NOTEBOOKLM_TASK_INCOMPLETE`.

| Artefact | Activité minimale |
| --- | --- |
| Vidéo | Fermer, expliquer 2 minutes, répondre à 3 questions inédites, appliquer dans un exercice |
| Slides | Fermer, reconstruire le plan, présenter sans lire, répondre à des questions |
| Quiz | Répondre, analyser les erreurs, retrouver les sources, refaire des questions différées |
| Audio | Écouter, restituer de mémoire, comparer, corriger, résumer oralement |
| Flashcards | Rappeler, employer dans une phrase et un exercice, planifier une révision |
| Autre | Produire une restitution sans support et une preuve d’application |

## Mode manuel de secours

```text
SourceBundle préparé
→ prompt généré
→ instructions affichées
→ utilisateur ouvre NotebookLM
→ utilisateur importe les sources
→ utilisateur colle le prompt
→ utilisateur génère l’artefact
→ utilisateur revient dans Learning OS
→ utilisateur déclare l’artefact obtenu
→ activité active
```

Ce parcours reste disponible si la skill est absente, la session expire, l’interface change,
l’automatisation échoue ou le gate refuse l’exécution : `MANUAL_ASSISTED_FALLBACK_AVAILABLE`.

## Politique de la skill legacy

```text
LEGACY_SKILL_CONDITIONALLY_ALLOWED
SECURITY_COMPLIANCE_FAILED
POLICY_DEFINED
MANUAL_ENFORCEMENT_REQUIRED
POLICY_ENFORCED_BY_CODE = NO
```

Conditions documentées : approbation explicite, sources allowlistées, classification connue, aucun
document Soufflet interne, aucun secret, une seule opération, aucun arrière-plan, maximum deux retries,
journalisation sans contenu et possibilité d’annulation.

Limites :

```text
maximum_concurrent_runs = 1
maximum_retries = 2
maximum_comparable_failures = 3
background_execution = false
automatic_bulk_upload = false
```

Après trois échecs comparables : `LEGACY_NOTEBOOKLM_SKILL_SUSPENDED_PENDING_REVIEW`.

## Traçabilité minimale

Conserver uniquement :

```text
task_id
mission_id
date
source_count
source_hashes
classifications
artifact_type
prompt_template_id
transfer_mode
approval_status
approved_by
execution_status
duration
result_reference
followup_status
```

Ne jamais journaliser cookies, tokens, mots de passe, contenu complet des documents, contenu complet des
preuves personnelles ou valeurs `.env`.

## Test conceptuel sans transmission

```text
Source : network-dns-training.pdf
Classification : TRAINING_SYNTHETIC
Rôle : PRIMARY_COURSE
Nombre : 1
Objectif : Comprendre la résolution DNS
Compétence : Expliquer et diagnostiquer une résolution DNS
Artefact : QUIZ
Mode : MANUAL_ASSISTED
Template : academic-quiz-v1
Activité : Expliquer DNS sans support puis résoudre un exercice inédit
```

Déroulement conceptuel :

```text
PREPARED
→ source unique existante, taille/checksum connus
→ classification autorisée
→ prompt complet affiché
→ WAITING_FOR_HUMAN_APPROVAL
→ HUMAN_APPROVED (conceptuel uniquement)
→ instructions manuelles affichées
→ aucune transmission automatique
→ activité active définie
```

Résultat du test de conception : `PASS`. Il valide la cohérence documentaire, pas une implémentation.

## Éléments restant à implémenter

- types et validations exécutables ;
- pré-vérification locale sur allowlist ;
- écran d’approbation ;
- invalidation automatique ;
- machine d’état ;
- journal expurgé ;
- adaptateur manuel dans l’application ;
- exécution contrôlée de la skill ;
- connecteur de remplacement sûr ;
- tests unitaires, intégration, sécurité et adversariaux.

Ces travaux ne font pas partie de T-0003B.
