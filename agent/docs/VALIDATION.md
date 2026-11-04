# Audit et vérification du référentiel

## Inspection documentaire

- [ ] `AGENTS.md` et `CLAUDE.md` présents et renvois corrects.
- [ ] Toutes les familles A, G, H, Q, T, S, F, B, DB, D, O, M, P, PK et X couvertes sans doublon d'identifiants.
- [ ] Les fichiers de stack couvrent Symfony, NestJS, React, Flutter, MariaDB et Docker.
- [ ] La règle `rules/17-api-testing.md` impose Postman **et** Bruno, `testing/postman` et `testing/bruno`, un seul environnement `<nomProjet>_local` par outil et des scénarios de succès et erreur.
- [ ] La famille CI est présente dans `rules/18-ci.md` avec 40 règles, distincte de la CD.
- [ ] `rules/19-cd.md` contient 36 règles Dokploy et les modèles ne déclenchent rien dans ce dépôt.
- [ ] Les modèles CD imposent CI sur le SHA testé et bloque si Dokploy vise une autre branche/tag.
- [ ] Les règles CD exigent le choix production seule ou préprod+prod.
- [ ] Le workflow `.github/workflows/ci.yml` ne fait que valider le catalogue documentaire.
- [ ] Le validateur local `python3 scripts/validate_repository.py` réussit.
- [ ] Les workflows CI des projets utilisent des contrôles bloquants, permissions minimales et pas de publication ni déploiement.
- [ ] Aucun secret réel dans les fichiers.
- [ ] Documentation ChatGPT explicite sur les limites de chargement automatique.

## Simulation sur dépôt de test

- [ ] Avec une branche dev, l'agent crée issue, branche depuis dev et PR vers dev.
- [ ] Après un merge confirmé, l'agent ferme les issues réellement terminées et supprime la branche de travail mergée, sans jamais supprimer une branche protégée.
- [ ] Sans dev, il utilise la branche par défaut.
- [ ] Il n'effectue pas de merge non demandé, même si la PR est prête.
- [ ] Il exécute la batterie complète existante (unitaires, intégration, E2E, lint, format, analyse statique, typecheck, build) et distingue réussi / échoué / impossible / non applicable.
- [ ] Il n'écrase pas de travail local et ne détruit pas de données.
- [ ] Une modification Docker n'ajoute pas `version` et ajoute le restart par défaut.
- [ ] Aucune donnée persistante sous volume Docker nommé/anonyme ; tous les chemins bind hôtes sont documentés dans `.env.example`.
- [ ] Sous Dokploy, `/etc/dokploy_volume/<APP>/<donnée>` est la convention par défaut, sans changement silencieux des données existantes ni de Backrest.
- [ ] Les fichiers `.env` sensibles restent hors du dépôt.
- [ ] Une refonte UI vérifie accessibilité, responsive et usages partagés.
- [ ] Une API HTTP nouvellement développée génère des collections **importables** et **exécutables** dans les deux outils.
- [ ] Les deux collections couvrent l'inventaire complet des routes/méthodes et des cas nominaux et erreurs pertinents.
- [ ] Une API localement disponible permet l'exécution des suites Postman et Bruno avec l'environnement `<nomProjet>_local`, et les résultats sont rapportés séparément.
- [ ] Les environnements versionnés ne contiennent ni secrets, ni environnements supplémentaires non demandés.

## Limite

Ces documents sont des instructions : leur existence ne garantit pas que chaque agent les suit. Valider leur comportement par une intervention de test réelle après installation. Le dépôt documentaire lui-même ne contient pas d'application permettant d'exécuter des suites unitaires/E2E/build. Son workflow exécute uniquement des contrôles structuraux. Les suites applicatives devront être validées après intégration des règles à chaque dépôt.

## V2

- [ ] Le chargement des règles est contextuel (socle commun, sections applicables).
- [ ] Aucun fichier Claude ne déclare une absence de CD.
- [ ] Aucun volume Docker géré, y compris temporaire et anonyme.
- [ ] Les tests de l'adaptateur Dokploy passent sans réseau, y compris les erreurs.
- [ ] Les familles release, UI, monorepo, exploitation et gouvernance sont présentes.

- [ ] Un contrôle des montages effectifs détecte également les volumes Docker anonymes créés par les images.

## Authentification automatique Postman + Bruno

- [ ] Les deux collections effectuent un login réel avant leurs requêtes protégées, sans copier-coller de Bearer.
- [ ] Les noms `accessToken` et `refreshToken` sont cohérents; Postman utilise `pm.environment.set`, Bruno utilise `bru.setVar` en mémoire (jamais `bru.setEnvVar` pour les tokens).
- [ ] Après échec login, aucun token précédent ne reste utilisable; refresh/logout et scénarios 401/403 sont validés si l'API les expose.
- [ ] Exécuter `node --test tests/test_api_auth.js` et les deux suites sur une API de test lors d'une intégration applicative.

## Skills — catalogue complet

- [ ] Les 20 dossiers Skills contiennent `SKILL.md` valide et leurs références propres.
- [ ] Le validateur détecte les Skills manquants, mal nommés ou dotés de liens cassés.
- [ ] Les procédures GitHub, API, Docker, CI, CD et release respectent les permissions et résultats réellement observés.
- [ ] Les Skills de stacks respectent les outils, versions et workflows effectivement présents.
- [ ] L'installation/native discovery est éprouvée séparément avec Codex, Claude Code et ChatGPT, si accessible.

## V2 — distribution et coordination

- [ ] Installer et synchroniser une sélection de Skills dans `.agents/skills` et `.claude/skills` sans toucher aux fichiers divergents ou non gérés.
- [ ] Tester preview, idempotence, mise à jour sûre, détection de symlink et suppression locale.
- [ ] Un Skill d'audit ne déclenche jamais seul un merge, un déploiement ou une intervention production.
- [ ] La matrice de coordination sélectionne uniquement les procédures pertinentes.

## Architecture template V3

- [ ] Vérifier `AGENTS.md`, `CLAUDE.md`, `.github/workflows` et `.claude/rules` à la racine.
- [ ] Vérifier `agent/rules`, `agent/skills`, `agent/docs`, `agent/scripts`, `agent/tests`, `agent/templates`.
- [ ] Exécuter `bash -n agent/scripts/init.sh` et `bash agent/tests/test_init.sh`.
- [ ] Exécuter `python3 agent/scripts/validate_repository.py` et la CI complète.
- [ ] Aucune branche, PR, déploiement ni suppression créée par l'init Bash.
