# ADR-0001 — Conserver et faire évoluer le monolithe modulaire

- Statut : `ACCEPTED`
- Date : 2026-08-11
- Ticket : T-0006
- Décideurs : propriétaire du projet et implémentation T-0006

## Contexte

Daily English Mission est déjà une application Next.js 16 avec React, TypeScript, Prisma/SQLite et une bibliothèque de composants shadcn/Radix. Sa page principale orchestre six étapes avec Zustand. Les routes API accèdent directement à Prisma et, pour la transcription/correction, à Z.ai.

Le plan V1 impose une évolution progressive : T-0007 ajoute le shell, T-0008 un runtime générique et T-0009 le premier parcours Excel. Une seconde application créerait deux modèles d’état, deux interfaces et une migration risquée.

## Décision

Engineer Learning OS est construit dans l’application existante sous forme de monolithe modulaire :

- `src/app/` : transport HTTP et présentation Next.js;
- `src/modules/` : règles métier indépendantes du framework;
- `src/main/` : composition des cas d’usage et adaptateurs;
- `src/shared/` : primitives transverses réellement stables;
- `src/config/` : configuration validée sans secret;
- Prisma/SQLite, fichiers locaux, audio et fournisseurs externes : adaptateurs.

Les nouveaux flux ne doivent pas importer les implémentations internes de Daily English Mission. Le legacy demeure accessible jusqu’à ce qu’un test de non-régression et une migration additive permettent son adaptation.

## Règles exécutables

1. Une route valide le transport puis appelle un cas d’usage; elle ne porte pas une politique pédagogique.
2. Un composant UI consomme un view model; il ne calcule pas un score canonique.
3. Zustand ne conserve que l’état éphémère de l’interface.
4. SQLite est l’autorité sur tentatives, preuves, évaluations, compétences et révisions.
5. Les fichiers personnels sont stockés localement hors Git; SQLite ne garde que leurs métadonnées.
6. Toute intégration externe implémente un port et est désactivée par défaut.
7. Les migrations sont additives, précédées d’une sauvegarde et accompagnées d’un rollback.

## Conséquences

Positives : réutilisation de l’interface et des dépendances, un déploiement local, migration progressive, tests par frontière. Négatives : coexistence temporaire avec le code legacy et effort d’extraction des routes directes.

## Alternatives rejetées

- Nouvelle application : rejetée, car contraire à `REUSE_EXISTING_APP_FIRST`.
- Microservices : rejetés pour V1; complexité opérationnelle sans besoin démontré.
- Adoption de DeepTutor/AFFiNE/PenEcho comme socle : différée; ces outils ne sont pas sur le chemin critique.

## Contrôle

Chaque ticket doit indiquer les modules touchés et vérifier l’absence d’import transversal interdit. Toute exception exige un nouvel ADR.

## Rollback

Cet ADR ne modifie aucun code. S’il est rejeté avant T-0007, le document peut être retiré sans effet sur l’application.

