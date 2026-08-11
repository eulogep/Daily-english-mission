# ADR-0002 — Profil local unique et absence d’exposition réseau en V1

- Statut : `ACCEPTED_FOR_V1`
- Date : 2026-08-11
- Ticket : T-0006
- Révision obligatoire : avant multi-utilisateur, LAN, tunnel ou déploiement distant

## Contexte

L’application actuelle n’expose pas de flux d’authentification visible. `next-auth` est présent dans les dépendances, mais sa présence ne constitue ni une session configurée ni une autorisation. Les données futures — productions, audio, évaluations et difficultés — sont personnelles.

## Décision

V1 utilise un profil d’apprenant local unique, explicite, sur une instance liée à la machine. Le serveur doit écouter sur loopback par défaut. Il n’existe aucun accès LAN/public, tunnel ou synchronisation cloud approuvé.

Le profil unique n’est pas présenté comme une authentification. Il sert à porter locale, fuseau, préférences et consentements. Les cas d’usage conservent un `learnerId` afin de ne pas bloquer une future migration, mais l’adaptateur V1 résout uniquement le profil local configuré.

## Contrats de sécurité

- Toute requête modifiant un état exige une session locale/origine valide selon la décision technique de T-0007/T-0008.
- Les fournisseurs externes restent bloqués sans consentement spécifique à l’opération.
- Les secrets ne sont jamais stockés dans le profil.
- L’interface affiche `LOCAL_ONLY` tant qu’aucun transfert externe n’est préparé.
- Le démarrage doit échouer ou avertir de façon bloquante si une écoute non-loopback est demandée sans ticket de sécurité.

## Critères déclenchant un nouvel ADR

- deuxième utilisateur;
- accès depuis un autre appareil;
- Cloudflare Tunnel ou reverse proxy public;
- stockage/synchronisation distante;
- besoin réglementaire d’identité ou de séparation des comptes.

## Conséquences

Cette décision réduit la surface d’attaque et permet T-0007 sans introduire un système d’identité incomplet. Elle interdit de considérer le `Caddyfile` actuel comme une configuration de production et reporte l’authentification complète à un besoin explicite.

## Rollback

Décision documentaire uniquement. Un futur ADR peut la remplacer avant toute exposition réseau.

