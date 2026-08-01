# Tasks

## T-0003C — Harden legacy NotebookLM execution

Statut : `NOT_STARTED`.

### Objectif

Durcir l’exécution de la skill NotebookLM legacy sans remettre en cause l’intégration pédagogique du
produit ni le fallback manuel assisté.

### Travaux requis

1. Supprimer `--no-sandbox`.
2. Supprimer les mécanismes anti-détection.
3. Valider strictement les domaines avant navigation.
4. Remplacer le stockage des cookies en clair.
5. Empêcher les installations automatiques dans le chemin d’exécution.
6. Implémenter le gate humain avant transmission.
7. Ajouter des tests locaux, mocks et scénarios adversariaux.
8. Limiter l’accès aux seuls fichiers allowlistés.
9. Borner concurrence, retries et échecs comparables.
10. Définir révocation, suspension et nettoyage contrôlé.
11. Préparer ou sélectionner un connecteur de remplacement sûr.

### Critères d’acceptation

- conformité sécurité réévaluée indépendamment ;
- aucune exécution non supervisée ;
- aucune donnée interdite transmissible ;
- approbation humaine traçable ;
- fallback `MANUAL_ASSISTED_NOTEBOOKLM` vérifié ;
- mode `NOTEBOOKLM_UNAVAILABLE` vérifié ;
- dette de sécurité couverte par des tests.

Ce ticket est seulement enregistré. Aucun travail d’implémentation T-0003C n’est commencé.
