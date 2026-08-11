# T-0006 — Fondation produit et contrats exécutables

## 1. Produit V1

Engineer Learning OS aide un apprenant à accomplir une mission courte, produire une preuve locale, recevoir une évaluation explicable et savoir quoi réviser. Daily English Mission devient progressivement une famille de missions; elle n’est ni supprimée ni dupliquée.

## 2. Utilisateur et contexte

- Utilisateur V1 : un apprenant local unique.
- Priorité observée : importer, structurer et analyser un CSV dans Excel.
- Première valeur : `EXCEL_CSV_FOUNDATIONS_LEVEL_1`.
- Contraintes : fatigue possible, besoin de reprise, compréhension faible des imports CSV, absence d’assistance IA pendant les évaluations indépendantes.

## 3. Jobs to be done

1. Quand j’ouvre l’application, je veux voir une seule prochaine action compréhensible.
2. Quand une consigne demande une manipulation externe, je veux savoir quoi faire et quelle preuve fournir.
3. Quand je suis interrompu ou fatigué, je veux reprendre sans recommencer.
4. Quand je me trompe, je veux connaître le critère manqué et la prochaine pratique.
5. Quand une IA ou un service externe est proposé, je veux savoir quelles données quitteront la machine avant de consentir.

## 4. Glossaire contractuel

| Terme | Définition V1 | Ne signifie pas |
|---|---|---|
| Mission | Définition versionnée d’une activité et de ses étapes | Une page codée en dur |
| Tentative | Exécution d’une version de mission par l’apprenant | La définition elle-même |
| Étape | Unité ordonnée avec type, consigne et condition de sortie | Une route Next.js |
| Preuve | Artefact ou réponse relié à une tentative | Un score automatique |
| Évaluation | Scores par critères et erreurs critiques versionnés | Une note globale opaque |
| Compétence | Capacité dont l’état est justifié par des preuves | Une simple catégorie de contenu |
| Révision | Nouvelle activité planifiée à partir d’une erreur ou d’une compétence | Réafficher la correction |
| Assistance | Aide déclarée ou fournie, conservée séparément du résultat | Une pénalité cachée |

## 5. Responsabilités par couche

| Décision | Propriétaire | Consommateurs |
|---|---|---|
| Contenu et version d’une mission | `mission-runtime` | UI, évaluation |
| Transition de tentative | cas d’usage du runtime | UI, audit |
| Affichage et saisie | `src/app` | apprenant |
| Écriture d’une preuve locale | `EvidenceStore` | assessment |
| Score par critère | `AssessmentService` | competency, UI |
| Transition de compétence | `CompetencyLedger` | planner, progress |
| Prochaine révision | `ReviewScheduler` | Today, Review |
| Transfert externe | adaptateur + gate de consentement | audit, UI |

## 6. Contrats d’état

### Tentative

```text
READY -> IN_PROGRESS -> PAUSED -> IN_PROGRESS
                     -> SUBMITTED -> ASSESSED -> COMPLETED
                     -> ABANDONED
```

- `READY -> IN_PROGRESS` exige une définition active/versionnée.
- `IN_PROGRESS -> PAUSED` persiste l’étape et le temps écoulé.
- `IN_PROGRESS -> SUBMITTED` exige toutes les sorties obligatoires.
- `SUBMITTED -> ASSESSED` exige une grille et sa version.
- `ASSESSED -> COMPLETED` exige l’enregistrement du résultat et de la prochaine action.
- `ABANDONED` ne supprime ni brouillon ni métadonnées de temps.

### Étape

```text
LOCKED -> AVAILABLE -> ACTIVE -> COMPLETED
                      -> SKIPPED (uniquement si facultative)
```

Une étape obligatoire ne peut pas être `SKIPPED`. Une étape complétée peut être consultée; sa modification exige une réouverture explicite et auditée.

## 7. Types d’étape minimum pour T-0008

`instruction`, `demonstration`, `external_action`, `short_answer`, `checklist`, `file_evidence`, `audio_evidence`, `self_assessment`, `result`.

Chaque type déclare : données attendues, validation, possibilité de pause, classification, aide autorisée, preuve et libellé d’erreur.

## 8. Critères produit T-0007 à T-0009

- T-0007 : trouver `Aujourd’hui`, comprendre `Commencer/Reprendre`, préserver Daily English Mission.
- T-0008 : terminer une mission synthétique, rafraîchir et reprendre, refuser une transition invalide.
- T-0009 : importer le CSV Niveau 1, séparer les colonnes, sauvegarder la preuve et expliquer les étapes sans tutoriel.

## 9. Hors périmètre T-0006

Code UI, runtime, modèles Prisma, migrations, Excel interactif, preuves personnelles, moteur de compétence/révision, audio, fournisseurs IA et outils tiers. Ce fichier définit leurs frontières; il ne les implémente pas.

## 10. Definition of Ready pour T-0007

- ADR-0001 et ADR-0002 acceptés.
- Routes cibles et états shell documentés.
- Wireframes relus avec le protocole T-0006.
- Route legacy et absence de sortie réseau inscrites dans les critères.
- Allowlist de code T-0007 décidée avant modification.

