# Politique et adoption de la CI

Les 40 règles [CI01–CI40](../rules/18-ci.md) décrivent la politique universelle. **CI et CD sont séparées** : ce guide concerne uniquement les validations. Voir [CD Dokploy](CD.md) pour les jobs dépendants de `ci-required`.

## Principe : adapter les jobs à la stack

| Contrôle | Symfony API | NestJS API | React pur | Flutter | Docker/DB |
| --- | --- | --- | --- | --- | --- |
| Format, lint et analyse statique | Oui | Oui | Oui | Oui | Hadolint si Docker |
| Tests unitaires et intégration | Si présents/attendus | Si présents/attendus | Si présents/attendus | Si présents/attendus | Tests de migrations si DB |
| E2E | Si présents | Si présents | Si présents | Si présents | Sans objet |
| Postman + Bruno | **Obligatoires** | **Obligatoires** | Non, sauf backend HTTP | Si API développée | Selon API |
| Build | App et assets | App | Vite | Android; iOS si pertinent | Image locale sans push |
| Audit dépendances | Composer | npm/pnpm | npm/pnpm | pub adapté | Trivy |
| SAST | CodeQL/Semgrep si disponible | Idem | Idem | Selon disponibilité | Scans images |
| Contrôle final stable | Oui | Oui | Oui | Oui | Oui |

**Attention :** les suites existantes doivent toutes tourner. Une catégorie `non applicable` est une classification motivée, jamais un `success` artificiel.

## Flux recommandé

1. Déclencher `pull_request` vers `dev` et `main`, et `push` vers ces branches lorsqu'elles existent.
2. Exécuter qualité, sécurité, conformité et builds en parallèle; exécuter DB + API locale avant les deux jobs de collections.
3. Produire JUnit, couverture, résultats des collections et diagnostics sans informations sensibles.
4. Agréger les résultats dans **un job `ci-required`**, configuré dans les Rulesets comme statut requis. Un échec ou un skip non autorisé empêche le merge.
5. Autoriser le merge uniquement sur demande explicite, après vérification des contrôles et des protections existantes.

## API : Postman et Bruno

Les collections restent dans `testing/postman` et `testing/bruno`. **Un seul environnement versionné** `<nomProjet>_local` par outil. Dans GitHub Actions, lancer une instance de l'API sur le runner et substituer seulement les valeurs `baseUrl` et secrets éphémères au runtime, sans ajouter `<nomProjet>_ci`.

- Postman : utiliser Newman sur Collection v2.1 et son fichier d'environnement, ou Postman CLI compatible, avec la totalité des assertions. Exemple indicatif de projet :

```bash
newman run testing/postman/nomProjet.postman_collection.json \
  -e testing/postman/nomProjet_local.postman_environment.json \
  --env-var "baseUrl=http://127.0.0.1:3000"
```

- Bruno : utiliser `@usebruno/cli` avec la syntaxe confirmée par la version réellement installée. Exemple indicatif :

```bash
bru run testing/bruno --env nomProjet_local \
  --env-var "baseUrl=http://127.0.0.1:3000"
```

L'arborescence OpenCollection YAML ou BRU doit être prise en charge par la version utilisée. **Valider ces commandes dans le dépôt applicatif avant de les intégrer dans un workflow**. Ne jamais lancer des tests d'écriture contre une API distante réelle.

## GitHub Actions : bonnes pratiques

- Limiter `GITHUB_TOKEN` à `contents: read` par défaut.
- Sur PR de fork : ne pas transmettre de secrets et ne pas utiliser `pull_request_target` pour exécuter du code du fork.
- Pinner les actions externes à des SHA complets vérifiés.
- Utiliser GitHub-hosted runners par défaut; protéger les runners persistants.
- Définir une clé de concurrence par workflow + PR/ref, sans annuler le run de la branche `main` à cause d'une PR.
- Mettre les dépendances en cache par lockfiles, sans secrets.
- Publier les résultats sur Checks et éventuellement des artefacts temporaires non sensibles.
- Ne pas utiliser `continue-on-error` sur un contrôle obligatoire; le job final doit identifier `failure`, `cancelled` et `skipped` inattendu.

## Activer la protection des branches

Après installation d'un vrai workflow dans le dépôt applicatif :

1. Créer un Ruleset pour `main` et `dev` si elle existe, avec PR obligatoire.
2. Exiger la réussite du statut final stable `ci-required`; ne pas deviner son nom dans GitHub tant qu'un run n'a pas créé le Check.
3. Interdire pushes directs et force pushes selon les permissions de l'organisation.
4. Vérifier les exceptions administrateur et les bypass intentionnels.
5. Ouvrir une PR de test provoquant un échec attendu, et contrôler que le merge est effectivement bloqué.

Le dépôt `agent-rules` est documentaire. Son workflow d'auto-validation peut contrôler les fichiers et la structure de la bibliothèque, **pas prouver les builds/tests d'applications qui n'y existent pas**.

## Documentation de chaque projet

Ajouter au README du projet une matrice simple : catégorie, commande exacte, environnement de test, prérequis, seuil, statut requis et raison des non-applicabilités. Le mode d'exécution doit être reproductible localement; les jobs CI ne remplacent pas les tests locaux demandés par [T01](../rules/05-testing.md).

## CD Dokploy

Le déploiement via Dokploy est désormais défini dans [CD.md](CD.md) et [rules/19-cd.md](../rules/19-cd.md), sans modification du rôle des jobs CI.

## Volume Docker géré interdit

Pour les projets conteneurisés, contrôler non seulement la déclaration Compose, mais aussi les `Mounts` des conteneurs réels lorsque c'est possible. Un volume anonyme peut être créé implicitement par une instruction `VOLUME` de l'image; dans cette politique, c'est une non-conformité, même pour des données temporaires. Utiliser un `tmpfs` ou une couche éphémère, en adaptant l'image si nécessaire.

## Auth Bearer automatique — Postman / Bruno

Pour une API protégée, exécuter les deux suites natives avec une étape de login réelle qui capture les tokens avant les requêtes sécurisées, conformément à [AT23–AT32](../rules/17-api-testing.md). Les scripts Bruno utilisent `bru.setVar` (runtime) et les scripts Postman `pm.environment.set` (sans export de valeurs réelles). Les tests statiques hors réseau du référentiel sont dans `tests/test_api_auth.js` ; ils ne remplacent pas les tests sur l'API cible.
