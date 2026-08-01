# Permissions NotebookLM

## Statut

```text
NOTEBOOKLM_PRODUCT_USAGE = APPROVED_AND_REQUIRED
LEGACY_NOTEBOOKLM_SKILL = CONDITIONALLY_ALLOWED
LEGACY_IMPLEMENTATION_SECURITY_COMPLIANCE = FAILED
LEGACY_IMPLEMENTATION_UNSUPERVISED_EXECUTION = FORBIDDEN
SAFE_REPLACEMENT_CONNECTOR = REQUIRED
POLICY_DEFINED
TECHNICAL_ENFORCEMENT_PENDING
MANUAL_ENFORCEMENT_REQUIRED
```

## Permissions déclaratives

```text
read_allowlisted_sources = true
recursive_disk_access = false
read_env_files = false
read_browser_main_profile = false
company_internal_data = false
company_restricted_data = false
automatic_bulk_upload = false
background_execution = false
human_approval_required = true
maximum_concurrent_runs = 1
maximum_retries = 2
maximum_comparable_failures = 3
```

Ces valeurs constituent une politique documentée. T-0003B n’ajoute aucun contrôle applicatif :
`POLICY_ENFORCED_BY_CODE = false`.

## Gate obligatoire

Chaque exécution suit exclusivement :

```text
WAITING_FOR_HUMAN_APPROVAL
→ HUMAN_APPROVED
→ EXECUTION_ALLOWED
```

Sans confirmation explicite : `EXECUTION_BLOCKED_NO_APPROVAL`.

Avant la confirmation, afficher :

- sources sélectionnées ;
- classification de chaque source ;
- taille et destination ;
- objectif pédagogique ;
- prompt exact ;
- action NotebookLM unique ;
- activité pédagogique suivante.

Toute modification du bundle, du prompt, de l’artefact, du mode, de la destination ou d’une
classification entraîne `APPROVAL_INVALIDATED` puis `WAITING_FOR_HUMAN_APPROVAL`.

## Données

Autorisées : `PUBLIC`, `TRAINING_SYNTHETIC`, `ACADEMIC_PERSONAL_USE`, `PERSONAL_APPROVED`.

Interdites : `COMPANY_INTERNAL`, `COMPANY_RESTRICTED`, `SECRETS`, `CREDENTIALS`, `HEALTH_DATA`,
`FINANCIAL_DATA`, `ID_DOCUMENTS`, `PRIVATE_AUDIO_WITHOUT_APPROVAL`, `UNKNOWN`.

`UNKNOWN` entraîne `DATA_CLASSIFICATION_REQUIRED`. Pour Soufflet Malt, seules les sources publiques et
les données synthétiques ou fictives sont autorisées.

## Limites

```text
max_concurrent_runs = 1
max_retries = 2
maximum_comparable_failures = 3
human_approval_required = true
background_execution = false
automatic_bulk_upload = false
```

Après trois échecs comparables : `LEGACY_NOTEBOOKLM_SKILL_SUSPENDED_PENDING_REVIEW`.

La skill ne peut ni sélectionner seule des sources supplémentaires, ni lire `.env`, ni publier un
notebook, ni contourner CAPTCHA/contrôle d’accès, ni installer silencieusement des dépendances, ni
supprimer une source ou un notebook sans confirmation.

Elle ne peut accéder qu’aux sources énumérées dans le bundle approuvé. Elle ne peut pas lire le profil
navigateur principal, exécuter plusieurs opérations, modifier l’application ou poursuivre une action
différente de celle confirmée.

## Fallback et expiration

`MANUAL_ASSISTED_NOTEBOOKLM` est le mode par défaut et le fallback obligatoire. La mission doit continuer
sans automatisation si le gate bloque, si la skill est indisponible, si la session expire ou si
l’interface change.

L’acceptation temporaire expire à la fin du prototype, après un transfert imprévu, une détection de
secret, un changement significatif d’interface, un incident de session Google, des échecs répétés, la
disponibilité d’un connecteur plus sûr, l’introduction de documents professionnels ou le passage à un
usage régulier/production.

À l’expiration : `RISK_ACCEPTANCE_EXPIRED` puis `HUMAN_REVIEW_REQUIRED`.
