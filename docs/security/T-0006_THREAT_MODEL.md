# T-0006 — Modèle de menace initial

- Version : 1.0
- Date : 2026-08-11
- Portée : instance locale V1, shell futur, runtime, preuves, audio et adaptateurs externes
- Données réelles utilisées : aucune

## 1. Hypothèses et limites

V1 fonctionne pour un apprenant sur une machine de confiance et écoute sur loopback. Le navigateur, les fichiers importés et tout contenu source restent non fiables. Le système d’exploitation, le compte local et les dépendances installées sont hors contrôle direct, mais leurs compromis ne doivent pas être aggravés par une exposition réseau.

Cette hypothèse devient invalide dès qu’un autre appareil, utilisateur, tunnel, reverse proxy ou cloud est introduit. Un nouvel ADR et une revue de menace sont alors obligatoires.

## 2. Diagramme de frontières

```text
[Learner]
    |
    v untrusted input
[Browser] --HTTP loopback--> [Next.js routes]
                               |        |
                               v        v optional, blocked by default
                         [Domain]    [External adapters]
                            |   \          |
                            v    v         v
                        [SQLite] [Local files] [External provider]
```

## 3. Actifs et impacts

| Actif | Confidentialité | Intégrité | Disponibilité |
|---|---:|---:|---:|
| Audio/transcription | critique | élevée | moyenne |
| Preuves et productions | élevée | élevée | élevée |
| Évaluations/compétences | élevée | critique | élevée |
| Answer keys/rubriques | moyenne | critique | moyenne |
| Base et sauvegardes | élevée | critique | critique |
| Secrets fournisseurs | critique | critique | moyenne |
| Définitions de mission | faible | critique | élevée |

## 4. Menaces prioritaires

| ID | Menace | Vecteur | Impact | Contrôle prévu | Ticket/gate |
|---|---|---|---|---|---|
| TM-01 | Traversée de chemin | nom/path d’un upload | lecture/écriture arbitraire | ID opaque, racine résolue, nom neutralisé, tests `..`/absolu | T-0010 |
| TM-02 | Upload actif ou surdimensionné | XLSM, HTML, archive, MIME forgé | exécution/DoS | allowlist, limites, détection type, jamais exécuter | T-0010/T-0020 |
| TM-03 | Injection CSV/tableur | cellule `=`, `+`, `-`, `@` | formule à l’ouverture/export | neutraliser exports, signaler contenu | T-0009/T-0020 |
| TM-04 | Answer key exposé | bundle/API client | baseline faussée | serveur/évaluateur seulement, test bundle | T-0009 |
| TM-05 | Exfiltration IA | audio/source envoyé automatiquement | fuite personnelle/académique | egress refusé, classification, aperçu et consentement | T-0012/T-0019 |
| TM-06 | Prompt injection source | document traité comme instruction | action/egress non voulu | contenu délimité, outils interdits, schéma de sortie | T-0015/T-0020 |
| TM-07 | Progression falsifiée | UI modifie score/état | compétence incorrecte | transitions serveur, ledger, version attendue | T-0008/T-0010 |
| TM-08 | Requête intersite | route locale modifiée depuis page hostile | changement de données | origine/session, SameSite, méthode/content-type | T-0008 |
| TM-09 | Accès LAN non autorisé | écoute `0.0.0.0`, proxy/tunnel | accès complet | loopback, pas de tunnel, configuration fixe | T-0007/T-0020 |
| TM-10 | SSRF/proxy arbitraire | `XTransformPort` actuel | accès services locaux | supprimer proxy dynamique | T-0020, critique avant exposition |
| TM-11 | Secret dans log/erreur | provider SDK, env, debug | compromission | redaction, codes opaques, scan secrets | T-0012/T-0020 |
| TM-12 | Corruption/perte | migration ou écriture partielle | historique perdu | transaction, backup hashé, restore testé | chaque migration/T-0020 |
| TM-13 | Dépendance compromise | package/fork tiers | code arbitraire | aucune dépendance T-0006, audit/SBOM/pin | ticket d’intégration |
| TM-14 | Contournement mono-utilisateur | profil local assimilé à auth | accès si exposition | ADR-0002, blocage non-loopback | T-0007 |

## 5. Abuse cases testables

1. Envoyer `../../.env` comme nom de preuve : refus, aucun fichier écrit.
2. Envoyer un fichier annoncé CSV mais binaire : refus avec code stable.
3. Soumettre une étape verrouillée : `409 INVALID_TRANSITION`, état inchangé.
4. Rejouer une transition avec ancienne version : conflit, pas d’écrasement.
5. Ouvrir une page hostile qui POST vers l’instance : requête refusée.
6. Tenter de consulter l’answer key avant soumission : aucune route/référence client.
7. Refuser l’ASR : audio lisible/supprimable localement et mission poursuivie.
8. Classifier une source `UNKNOWN` : opération externe bloquée.
9. Couper la base après écriture fichier : nettoyage d’orphelin ou reconciliation.
10. Restaurer le snapshot : nombres, empreintes et transitions cohérents.

## 6. Risques acceptés temporairement

- Le code legacy appelle directement Z.ai : accepté uniquement pour préserver l’existant local, non approuvé pour les nouveaux flux.
- `next.config.ts` ignore les erreurs TypeScript et `Caddyfile` accepte un port dynamique : documentés, non corrigés en T-0006, bloquants avant V1/exposition.
- Profil unique sans authentification complète : accepté uniquement avec loopback et machine de confiance.

## 7. Gate de sortie T-0006

- propriétaires et tickets assignés à chaque menace élevée/critique;
- aucune donnée personnelle copiée dans ce document;
- T-0007 inclut loopback, origine/session et préservation legacy;
- T-0009 inclut answer key et CSV injection;
- T-0010 inclut tests upload/chemin et restauration;
- aucun outil externe intégré par T-0006.

