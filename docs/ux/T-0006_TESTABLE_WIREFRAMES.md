# T-0006 — Wireframes testables et protocole de walkthrough

Ces maquettes basse fidélité définissent la hiérarchie, les libellés et les états. Elles ne constituent pas une implémentation T-0007.

## 1. Shell bureau

```text
+----------------------+----------------------------------------------+
| Engineer Learning OS | Aujourd’hui                     LOCAL_ONLY   |
|----------------------|----------------------------------------------|
| > Aujourd’hui        | Bonjour                                      |
|   Apprendre          |                                              |
|   Réviser            | [ REPRENDRE ] Excel CSV — Niveau 1           |
|   Matières           | Objectif : importer un CSV correctement      |
|   Professionnel      | 15 min · Étape 2 sur 5                       |
|   Preuves            | Pourquoi : priorité issue de la baseline     |
|   Progression        |                                              |
|                      | Révision due                                 |
|   Paramètres locaux  | Aucune pour aujourd’hui                      |
+----------------------+----------------------------------------------+
```

Règles : une action primaire; la raison est visible; `LOCAL_ONLY` n’est pas une décoration mais le statut d’egress; Daily English Mission reste accessible pendant la migration.

## 2. Shell mobile

```text
+--------------------------------+
| [Menu] Aujourd’hui  LOCAL_ONLY |
|--------------------------------|
| Excel CSV — Niveau 1           |
| Importer un CSV correctement   |
| 15 min · Reprise étape 2/5     |
|                                |
| [ Reprendre ]                  |
|                                |
| Pourquoi cette mission ?       |
| Priorité issue de la baseline  |
+--------------------------------+
```

Le menu conserve les mêmes intitulés et l’ordre du bureau. Aucun contenu essentiel n’est caché derrière un survol.

## 3. Fiche avant mission

```text
Excel CSV Foundations — Niveau 1

Objectif       Séparer correctement les colonnes d’un CSV
Durée          15 à 20 minutes
Outil          Excel déjà installé
Données        TRAINING_SYNTHETIC
Réseau         Aucun
Preuve         Fichier sauvegardé + explication courte
Aide           Démonstration autorisée avant l’explication

[Retour]                                     [Commencer]
```

## 4. Mission runner

```text
+----------------------------------------------------------+
| Niveau 1                    Étape 2/5         06:12       |
| [Mettre en pause]                           LOCAL_ONLY    |
|----------------------------------------------------------|
| Import guidé                                             |
| 1. Dans Excel, choisissez Données.                       |
| 2. Sélectionnez À partir d’un fichier texte/CSV.          |
| 3. Vérifiez UTF-8 et le délimiteur virgule.               |
|                                                          |
| [Afficher l’indice]                                      |
|                                                          |
| [Retour]                                    [J’ai fini]   |
+----------------------------------------------------------+
```

L’indice incrémente une assistance observable. `J’ai fini` valide les sorties requises; il ne marque pas arbitrairement toute la mission comme terminée.

## 5. Pause et reprise

```text
Mettre la mission en pause ?

Votre étape et votre temps seront sauvegardés localement.
Vous pourrez reprendre depuis Aujourd’hui.

[Continuer la mission]                  [Mettre en pause]
```

Après confirmation persistée : afficher `Mission en pause — sauvegardée à 14:32`. En cas d’échec, rester dans la mission et ne pas annoncer une sauvegarde.

## 6. Preuve

```text
Déposer votre preuve

Destination : stockage local
Classification : PERSONAL
Accepté : .xlsx ou .csv · limite à définir avant T-0010

[Choisir un fichier]
analyse-niveau-1.xlsx · validation en cours

Expliquez les étapes sans regarder le tutoriel :
[________________________________________________]

[Retour]                                      [Soumettre]
```

Le glisser-déposer n’est jamais le seul moyen. Le chemin système complet n’est pas affiché ni renvoyé par l’API.

## 7. Résultat

```text
Résultat de la tentative

Atteint      Colonnes séparées · UTF-8 · fichier sauvegardé
À revoir     Expliquer comment reconnaître le délimiteur
Confiance    2/5 (déclarée)
Assistance   1 indice utilisé

Prochaine action : refaire l’import sur un nouveau fichier
[Voir la preuve]                       [Planifier la révision]
```

Les résultats par critère précèdent toute moyenne. Une erreur critique bloque le passage de niveau mais n’efface pas les acquis.

## 8. États alternatifs

| État | Message/action principale |
|---|---|
| Première visite | `Commencer` avec objectif et durée |
| Tentative reprenable | `Reprendre à l’étape N` |
| Aucun contenu | explication et lien vers Apprendre, pas de faux score |
| Chargement | squelette nommé, navigation disponible |
| Erreur | raison actionnable + retry, brouillon conservé |
| Hors ligne | `Mode local`; aucun spinner de fournisseur |
| Fatigue | pause sûre, prochaine durée suggérée |
| Route future | `Bientôt disponible`, retour Aujourd’hui |

## 9. Protocole de walkthrough utilisateur

Le reviewer ne guide pas et chronomètre chaque tâche.

1. Depuis le shell, montrer où commencer la mission du jour.
2. Expliquer en une phrase pourquoi elle est proposée.
3. Trouver où reprendre une mission interrompue.
4. Identifier si les données restent locales.
5. Ouvrir la fiche Excel et expliquer objectif, durée, outil et preuve.
6. Mettre en pause puis dire ce qui sera conservé.
7. Sur l’écran preuve, expliquer ce qui est envoyé et où.
8. Sur le résultat, distinguer performance, confiance et assistance.

Mesures : réussite sans aide, temps, hésitations, libellé incompris, erreur critique, commentaire. Ne pas inventer de réponse; consigner l’observation lors de la session humaine.

## 10. Feuille de résultat

```text
Reviewer:
Date:
Device:
Task 1..8 success:
Total time:
Critical misunderstandings:
Navigation labels to revise:
Privacy understanding:
Decision: ACCEPT / REVISE / BLOCK
```

Statut T-0006 : protocole et wireframes prêts. Administration humaine à réaliser avant l’acceptation finale de T-0007.

