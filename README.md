# Engineer Learning OS — Soufflet Mission

Ce dépôt contient la base existante de Daily English Mission et prépare son évolution progressive vers
un système personnel d’apprentissage, de pratique et de preuve de maîtrise.

L’architecture cible est décrite dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Le squelette créé
n’active aucune nouvelle fonctionnalité et ne déplace pas l’application existante.

## État

- T-0001 : inventaire documentaire terminé.
- T-0002 : audit initial terminé avec le verdict `PARTIALLY_READY`.
- T-0003 : produit NotebookLM approuvé ; skill legacy conditionnelle, conformité sécurité échouée.
- T-0003B : intégration contrôlée NotebookLM conçue (`NOTEBOOKLM_CONTROLLED_INTEGRATION_DESIGNED`).
- T-0003C : durcissement de l’exécution legacy enregistré, non commencé.
- Architecture cible : frontières créées, migration fonctionnelle non commencée.
- T-0004 et tickets suivants : non commencés.

## Principes

- apprentissage réel avant accumulation de fonctionnalités ;
- données personnelles locales par défaut ;
- NotebookLM requis comme capacité pédagogique ; legacy uniquement après approbation humaine explicite ;
- fallback manuel assisté et fonctionnement dégradé obligatoires ;
- autres services externes explicites, consentis et remplaçables ;
- modules métier indépendants de Next.js, Prisma et des fournisseurs IA ;
- preuves synthétiques et reproductibles pour les tests.
