# T-0006 — Inventaire des routes et composants

État observé : 2026-08-11. Inventaire ciblé, sans modification du code.

## 1. Routes d’interface existantes

| Route | Source | Rôle actuel | Décision | Ticket |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Mission anglaise en six étapes | `ADAPT` et préserver comme flux legacy | T-0007 |
| layout racine | `src/app/layout.tsx` | Fonts, metadata Z.ai, Toaster | `ADAPT`; metadata locale, shell futur | T-0007 |

Aucune autre page applicative n’a été détectée dans le périmètre ciblé.

## 2. Routes API existantes

| Méthode/route | Dépendances observées | Responsabilité actuelle | Décision |
|---|---|---|---|
| `GET /api/daily-mission` | Prisma | sélectionner/créer la mission et ses mots | `ADAPT`; extraire cas d’usage ultérieurement |
| `PATCH /api/daily-mission` | Prisma | sauvegarder phrases/fin | `ADAPT`; validation et transaction à renforcer |
| `POST /api/speaking-session` | Z.ai + Prisma | envoyer audio, transcrire, persister | `REPLACE` par port avec consentement; conserver contrat legacy jusqu’à migration |
| `POST /api/speaking-session/repeat` | Prisma | marquer répétition/durée | `ADAPT` |
| `POST /api/correction` | Z.ai + Prisma | corriger transcription, feedback | `REPLACE` par port; mode local requis |

T-0006 ne change aucune route. T-0007 ne doit pas changer le comportement de ces API sauf ticket explicite.

## 3. Composants de mission existants

| Composant | Rôle | Dépendances/effets | Décision |
|---|---|---|---|
| `WordsStep` | charger et afficher les mots | GET daily mission, Zustand | `ADAPT` comme pattern instruction/catalogue |
| `SentencesStep` | saisir phrases personnelles | PATCH daily mission | `ADAPT` comme réponse texte |
| `SpeakingStep` | enregistrer et transcrire | MediaRecorder, microphone, POST externe indirect | `ADAPT` capture; séparer transcription |
| `CorrectionStep` | afficher correction | POST correction | `ADAPT` présentation; isoler fournisseur |
| `RepeatStep` | réenregistrer | MediaRecorder, POST repeat | `ADAPT` capture/répétition |
| `DoneStep` | résumé et complétion | PATCH mission, reset Zustand | `ADAPT` comme pattern résultat |

## 4. Composants UI réutilisables

Le dépôt contient déjà les primitives nécessaires au shell et aux maquettes : `button`, `card`, `badge`, `sidebar`, `navigation-menu`, `sheet`, `progress`, `alert`, `skeleton`, `tooltip`, `dialog`, `breadcrumb`, `tabs`, `textarea`, `input`, `table` et `toast`. T-0007 n’a donc pas besoin d’une nouvelle bibliothèque UI.

## 5. État et données existants

- `src/lib/store.ts` : état de mots, mission, transcription, enregistrement et étape courante. Décision : UI legacy seulement.
- `src/types/index.ts` : `MissionStep` fermé sur six valeurs. Décision : ne pas l’étendre pour le runtime générique; créer un contrat distinct à T-0008.
- `prisma/schema.prisma` : `Word`, `SpeakingSession`, `DailyMission`. Décision : migrations additives, aucune suppression.
- `src/lib/db.ts` : client Prisma partagé. Décision : conserver comme adaptateur, ne pas importer depuis le domaine.

## 6. Routes cibles réservées à T-0007+

| Route cible | Première responsabilité | État T-0006 |
|---|---|---|
| `/today` | mission recommandée/reprise | spécifiée, non créée |
| `/learn` | catalogue filtré | spécifiée, non créée |
| `/review` | révisions dues | placeholder T-0007 |
| `/subjects` | matières | placeholder T-0007 |
| `/professional` | scénarios | placeholder T-0007 |
| `/evidence` | preuves locales | placeholder T-0007, données T-0010 |
| `/progress` | progression explicable | placeholder T-0007, données T-0010 |
| `/settings` | profil local/confidentialité | spécifiée, portée à trancher T-0007 |
| `/missions/[slug]` | présentation d’une mission | T-0008 |
| `/attempts/[id]` | mission runner | T-0008 |

Pour éviter une rupture, T-0007 doit choisir explicitement si `/` reste le legacy ou redirige vers `/today`; aucune redirection n’est autorisée sans test de non-régression.

## 7. Risques et inconnues

- `next-auth` est déclaré mais aucun usage n’a été établi dans le working set; ne pas le supposer configuré.
- Les fichiers applicatifs sont actuellement non suivis dans l’état Git observé; leur propriété et leur future indexation exigent une revue séparée.
- Le script `build` utilise des commandes de copie de style Unix, potentiellement incompatibles avec PowerShell natif après la compilation Next.
- Les appels Z.ai et le proxy dynamique sont hors T-0006, mais bloquent une exposition réseau sûre.

