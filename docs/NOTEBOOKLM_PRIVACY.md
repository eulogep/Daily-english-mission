# Confidentialité de l’intégration NotebookLM

## Statut

```text
POLICY_DEFINED
MANUAL_ENFORCEMENT_REQUIRED
TECHNICAL_ENFORCEMENT_PENDING
```

Cette politique décrit les décisions de T-0003B. Aucun transfert n’a été réalisé pour la rédiger.

## Principe de minimisation

Une opération NotebookLM ne contient que les sources strictement nécessaires à un objectif pédagogique
déclaré. Le système ne parcourt pas récursivement le disque, ne complète pas automatiquement la sélection
et ne lit jamais `.env`, cookies, tokens ou credentials.

Chaque opération est bornée par un `SourceBundle` avec nombre, taille, rôles, classifications, checksums,
date d’expiration et destination. Une nouvelle source impose une nouvelle approbation.

## Données autorisées

| Classification | Condition |
| --- | --- |
| `PUBLIC` | Source publiquement accessible et adaptée à l’objectif |
| `TRAINING_SYNTHETIC` | Données explicitement fictives ou synthétiques |
| `ACADEMIC_PERSONAL_USE` | Document académique utilisé personnellement, non publié, approuvé par l’utilisateur |
| `PERSONAL_APPROVED` | Donnée personnelle identifiée et explicitement approuvée pour l’opération |

Une classification autorisée ne dispense pas du gate humain ni de la minimisation.

## Données interdites

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

```text
UNKNOWN → DATA_CLASSIFICATION_REQUIRED → TRANSFER_BLOCKED
COMPANY_INTERNAL → DATA_POLICY_BLOCKED
COMPANY_RESTRICTED → DATA_POLICY_BLOCKED
```

Pour Soufflet Malt, seules des sources `PUBLIC` ou `TRAINING_SYNTHETIC` sont admissibles. Les données
synthétiques doivent être signalées comme fictives et ne jamais être présentées comme des données réelles
de l’entreprise.

## Pré-vérification et motifs sensibles

Avant approbation, vérifier type, extension, taille, existence, checksum, classification, rôle, données
personnelles et mentions professionnelles. La détection indicative inclut notamment :

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

Une correspondance ne modifie pas le fichier. Elle produit `SENSITIVE_PATTERN_DETECTED` puis
`HUMAN_REVIEW_REQUIRED`. La revue ne peut pas autoriser une catégorie explicitement interdite.

## Approbation humaine

Avant toute transmission, afficher :

- objectif et compétence ;
- noms relatifs, types, tailles, rôles, classifications et checksums abrégés ;
- nombre et taille totale ;
- destination NotebookLM ;
- artefact et prompt complets ;
- activité active suivante ;
- risques connus.

```text
WAITING_FOR_HUMAN_APPROVAL
→ HUMAN_APPROVED
→ EXECUTION_ALLOWED
```

L’approbation est ponctuelle. Toute modification du bundle, du prompt, du mode, de l’artefact, de la
classification ou de la destination produit `APPROVAL_INVALIDATED` et exige une nouvelle approbation.
Sans confirmation : `EXECUTION_BLOCKED_NO_APPROVAL`.

## Publication et partage

La publication d’un notebook est interdite par défaut. Un notebook académique personnel ne doit pas être
rendu public ni partagé « anyone with link ». T-0003B n’autorise aucune publication automatique.

Tout partage futur constitue une opération distincte avec destinataires, durée et contenu affichés, puis
approbation explicite. La skill legacy ne doit pas publier un notebook.

## Documents académiques

- Vérifier que l’usage personnel est légitime et cohérent avec les droits applicables.
- Sélectionner seulement le chapitre ou document utile, pas un dossier complet.
- Ne pas incorporer le contenu dans Git, les rapports ou les logs.
- Ne pas rendre le notebook public.
- Reclasser et réapprouver après toute modification de la sélection.

## Données personnelles

`PERSONAL_APPROVED` exige que l’utilisateur voie exactement les données concernées et accepte leur
transmission pour l’objectif déclaré. Les données de santé, financières et pièces d’identité restent
interdites même si elles sont personnelles. Un audio privé exige une approbation spécifique et ne peut
pas être déduit d’une approbation de document.

## Données professionnelles

Les documents, exports, captures, messages, identifiants, KPI ou notes internes Soufflet sont interdits.
Une mention professionnelle détectée exige une revue. Les missions de préparation à l’alternance utilisent
uniquement des sources publiques ou des scénarios synthétiques clairement marqués.

## Rétention locale

Conserver uniquement les métadonnées minimales : identifiants de tâche/mission, date, nombre de sources,
hashes, classifications, type d’artefact, identifiant de template, mode, approbation, exécution,
référence du résultat et suivi pédagogique.

Ne jamais conserver dans les traces : contenu complet des sources, preuves personnelles complètes,
questions/réponses sensibles, cookies, tokens, mots de passe ou valeurs `.env`.

`expires_at` est obligatoire pour le bundle. À expiration, l’approbation n’est plus valable. La durée est
choisie lors de la préparation en fonction de la mission et ne doit pas dépasser le besoin pédagogique.

## Rétention externe

La durée de conservation et le traitement exacts chez NotebookLM/Google ne sont pas établis par le code
local. Avant une première utilisation connectée avec des données personnelles ou académiques, l’utilisateur
doit vérifier les paramètres et politiques applicables. Cette incertitude est un risque accepté
temporairement, pas une garantie de suppression.

## Suppression

La suppression doit couvrir séparément :

1. références et traces locales ;
2. profil/cookies de la skill legacy ;
3. sources et notebook dans NotebookLM ;
4. partages éventuels ;
5. artefacts téléchargés et copies locales.

La suppression distante est manuelle tant qu’aucun connecteur audité ne fournit de preuve. Toute
suppression destructive exige confirmation. Une entrée retirée de `library.json` ne prouve pas la
suppression chez NotebookLM.

## Mode manuel assisté

`MANUAL_ASSISTED` ne supprime pas les obligations de classification et d’approbation. Il limite cependant
l’automatisation : l’utilisateur ouvre NotebookLM, sélectionne les sources et colle le prompt lui-même.
Les instructions doivent rappeler la destination, les sources approuvées et l’interdiction d’en ajouter.

## Risques de la skill legacy

```text
LEGACY_SKILL_CONDITIONALLY_ALLOWED
SECURITY_COMPLIANCE_FAILED
```

Risques acceptés temporairement : cookies persistants non chiffrés, `--no-sandbox`, anti-détection, URL
insuffisamment validée, installation automatique, absence de tests et capacités incomplètes.

Conditions : demande et approbation explicites, compte autorisé, sources allowlistées, une opération,
aucun arrière-plan, deux retries maximum, une exécution concurrente, journalisation sans contenu et
annulation possible. Ces conditions sont documentées mais non encore garanties par le code.

## Expiration de l’acceptation temporaire

L’acceptation expire lors de :

- fin du prototype ;
- transfert imprévu ou détection d’un secret ;
- changement significatif de l’interface NotebookLM ;
- incident avec la session Google ;
- trois échecs comparables ;
- disponibilité d’un connecteur plus sûr ;
- introduction de documents professionnels ;
- passage à un usage régulier ou en production.

```text
RISK_ACCEPTANCE_EXPIRED
HUMAN_REVIEW_REQUIRED
```

À expiration, aucune nouvelle exécution legacy n’est autorisée avant revue. Le mode
`MANUAL_ASSISTED_NOTEBOOKLM` et une activité locale restent disponibles selon les mêmes règles de données.

## Responsabilités

- Le préparateur construit et affiche le bundle sans transmettre.
- L’utilisateur classe, examine et approuve l’opération précise.
- L’exécuteur n’agit que sur l’opération approuvée.
- La mission exige une activité active après l’artefact.
- T-0003C doit rendre les politiques techniquement applicables et préparer un connecteur sûr.
