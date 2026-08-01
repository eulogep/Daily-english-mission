# Bibliothèque de prompts NotebookLM

## Statut

```text
PROMPT_LIBRARY_VERSION = 1
POLICY_DEFINED
NO_PROMPT_EXECUTED_DURING_T-0003B
```

Chaque prompt est affiché intégralement dans l’écran d’approbation. Les placeholders doivent être
résolus avant `HUMAN_APPROVED`. Toute modification du prompt après approbation produit
`APPROVAL_INVALIDATED`.

Règles communes :

- utiliser uniquement les sources du `SourceBundle` approuvé ;
- ne pas inventer de faits absents des sources ;
- relier les affirmations aux sources lorsque le format le permet ;
- ne jamais inclure secret, credential ou donnée interdite ;
- conserver `prompt_template_id` dans la trace ;
- associer une activité active à l’artefact.

## `academic-quiz-v1` — Quiz académique

Artefact recommandé : `QUIZ`.

```text
À partir uniquement des sources sélectionnées, crée un quiz progressif sur [SUJET].

Objectif :
[OBJECTIF]

Produis :
- 5 questions de rappel ;
- 5 questions d’application ;
- 3 questions de diagnostic ;
- 2 questions de transfert.

Pour chaque correction :
- expliquer la réponse ;
- indiquer la source concernée ;
- signaler le piège principal.

Ne pas introduire de notion absente des sources.
Ne pas révéler les réponses avant la tentative.
```

Activité active : répondre sans aide, analyser les erreurs, retrouver les passages sources et refaire des
questions différées.

## `explanatory-slides-v1` — Présentation explicative

Artefact recommandé : `SLIDE_DECK`.

```text
Crée une présentation pédagogique sur [SUJET] à partir uniquement des sources sélectionnées.

Public :
étudiant ingénieur reprenant les fondamentaux.

Structure :
1. problème ;
2. notions nécessaires ;
3. fonctionnement ;
4. exemple ;
5. erreurs fréquentes ;
6. application ;
7. synthèse ;
8. questions de vérification.

Utilise peu de texte par slide.
Conserve les termes techniques importants.
Relie les affirmations aux sources.
```

Activité active : fermer les slides, reconstruire le plan de mémoire, présenter sans lire puis répondre à
des questions.

## `explanatory-video-v1` — Vidéo explicative

Artefact recommandé : `VIDEO_OVERVIEW`.

```text
Crée une vidéo explicative sur [SUJET] à partir uniquement des sources sélectionnées.

Objectif :
permettre à l’utilisateur d’expliquer ensuite la notion sans support.

Contraintes :
- progression logique ;
- langage clair ;
- exemples concrets ;
- schémas simples ;
- distinction entre définition, mécanisme et application ;
- aucune information non soutenue par les sources.
```

Activité active : fermer la vidéo, expliquer pendant deux minutes, répondre à trois questions inédites et
appliquer la notion dans un exercice.

## `english-audio-overview-v1` — Résumé audio en anglais

Artefact recommandé : `AUDIO_OVERVIEW`.

```text
Create an English audio overview based only on the selected sources.

Target level:
[LEVEL]

Goal:
help the learner understand and explain [TOPIC] in professional English.

Include:
- the main concepts;
- essential technical vocabulary;
- one practical example;
- three review questions.

Use clear professional English.
Do not add unsupported information.
```

Activité active : écouter sans transcription, noter les idées de mémoire, comparer, corriger puis résumer
oralement en anglais.

## `soufflet-synthetic-mission-v1` — Mission Soufflet synthétique

Artefact recommandé : `STUDY_GUIDE`, `QUIZ`, `BRIEFING` ou `SLIDE_DECK` selon l’objectif.

Précondition : toutes les sources sont `PUBLIC` ou `TRAINING_SYNTHETIC`.

```text
À partir uniquement des sources publiques et des données synthétiques sélectionnées, crée un support pédagogique sur [SUJET].

Contexte :
préparation à un rôle junior de gestion de projet Industrie 4.0.

Produis :
- les concepts essentiels ;
- un glossaire bilingue ;
- un exemple fictif ;
- cinq questions de vérification ;
- une activité de présentation orale.

Ne pas inventer d’information interne sur Soufflet Malt.
Ne pas présenter les données synthétiques comme des données réelles.
```

Activité active : présenter le scénario comme fictif, expliquer les concepts et répondre à cinq questions
de vérification sans support.

## `powerbi-sql-learning-guide-v1` — Préparation Power BI ou SQL

Artefact recommandé : `STUDY_GUIDE`.

```text
À partir des sources sélectionnées, crée un guide d’apprentissage sur [SUJET].

Inclure :
- définition ;
- prérequis ;
- fonctionnement ;
- exemple ;
- erreurs fréquentes ;
- exercice d’application ;
- question de transfert ;
- grille d’auto-vérification.

Distinguer clairement les éléments provenant des sources et les exercices proposés.
```

Activité active : refaire l’exemple sans le guide, résoudre l’exercice puis expliquer la réponse à la
question de transfert.

## Sélection du template

| Besoin | Template prioritaire | Alternatives |
| --- | --- | --- |
| Mémorisation académique | `academic-quiz-v1` | `explanatory-slides-v1` |
| Compréhension initiale | `explanatory-slides-v1` | `explanatory-video-v1` |
| Explication orale | `explanatory-video-v1` | `explanatory-slides-v1` |
| Écoute/anglais professionnel | `english-audio-overview-v1` | Quiz bilingue dérivé après nouvelle approbation |
| Préparation Soufflet | `soufflet-synthetic-mission-v1` | Aucun si une source n’est pas publique/synthétique |
| Power BI ou SQL | `powerbi-sql-learning-guide-v1` | `academic-quiz-v1` |

L’utilisateur peut remplacer la recommandation avant approbation. Après approbation, le remplacement
exige une nouvelle validation du prompt et de l’activité active.

## Placeholders

| Placeholder | Exigence |
| --- | --- |
| `[SUJET]` / `[TOPIC]` | Sujet précis, cohérent avec le bundle |
| `[OBJECTIF]` | Résultat d’apprentissage observable |
| `[LEVEL]` | Niveau linguistique explicitement choisi |

Un placeholder non résolu bloque l’approbation avec `PROMPT_INCOMPLETE`.
