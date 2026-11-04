# Authentification automatique — Postman et Bruno

Complément des [règles AT23–AT32](../rules/17-api-testing.md). **L'objectif est zéro copier-coller de Bearer token**, avec deux collections **natives**, pas un script universel prétendument compatible.

## Parité des variables

| Usage | Postman | Bruno |
| --- | --- | --- |
| Configuration `baseUrl` | Environnement `<nomProjet>_local` | Environnement `<nomProjet>_local` |
| Jeton de login | `pm.environment.set("accessToken", …)` | `bru.setVar("accessToken", …)` |
| Jeton de refresh | `pm.environment.set("refreshToken", …)` | `bru.setVar("refreshToken", …)` |
| Lire Bearer | `{{accessToken}}` | `{{accessToken}}` |
| Effacer session | `pm.environment.unset("accessToken")` | `bru.deleteVar("accessToken")` |

**Attention Bruno v4 : `bru.setEnvVar()` écrit désormais dans le fichier d'environnement.** Un token pourrait alors être committé. Pour les tokens générés, **toujours** préférer `bru.setVar()`, qui reste en mémoire pour les requêtes suivantes. Même nom de variable, stockage adapté à chaque outil. L'environnement `<nomProjet>_local` demeure le seul fichier d'environnement versionné et ne contient jamais les valeurs réelles des jetons.

## Exemple d'une réponse de login

```json
{
  "accessToken": "EXAMPLE_NOT_REAL",
  "refreshToken": "EXAMPLE_NOT_REAL"
}
```

Adapter le chemin des champs (par exemple `data.access_token`), le statut HTTP attendu, le type de credentials et l'endpoint à **l'API réelle**, sans inventer de convention universelle.

### Postman — script post-response du login

Voir [l'exemple natif Postman](../examples/api-auth/postman-login.js). La requête doit être sans auth. Le script vérifie le statut et la présence d'un token non vide, supprime d'abord les éventuels tokens précédents, puis remplit les variables de l'environnement actif. L'onglet Authorization des requêtes sécurisées utilise **Bearer Token = `{{accessToken}}`**.

### Bruno — script post-response du login

Voir [l'exemple natif Bruno](../examples/api-auth/bruno-login.js). La requête doit être sans auth. Utiliser `res.getBody()`, puis `bru.setVar()` pour des **variables runtime**, résolues par `{{accessToken}}` dans l'onglet Auth → Bearer. Ne pas utiliser `bru.setEnvVar()`, ni copier du code `pm.*`.

Ces deux exemples sont des *corps de scripts JavaScript* à intégrer au format natif de la collection cible : Postman Collection JSON v2.1 ou Bruno BRU/OpenCollection YAML conforme à sa version. Ils ne remplacent **pas** la création des requêtes/fichiers natifs complets.

## Ordonnancement

1. Lancer l'API et la DB de test avec données/credentials de test.
2. Exécuter la requête de login, qui met les variables runtime ou locales à jour automatiquement.
3. Exécuter les scénarios protégés avec `{{accessToken}}`.
4. Tester login invalide, 401 sans token, 401 token périmé/invalide, 403 rôle insuffisant (si supporté), **sans réutiliser le token valide** dans ces scénarios.
5. Tester refresh et rotation des tokens si l'API le permet; ne jamais boucler automatiquement sur un 401.
6. Tester la déconnexion/révocation et supprimer les jetons des variables concernées.

Pour **Postman**, les changements d'environnement peuvent persister ou être synchronisés : ne pas partager/exporter les valeurs secrètes et vérifier les fichiers avant commit. Pour **Bruno**, les jetons générés doivent rester en runtime et ne doivent pas apparaître dans un fichier sous `testing/bruno`.

## Validation

- Exécuter **les deux runners réels** sur l'API de test, avec l'environnement local unique.
- Vérifier que login renseigne le Bearer et que les requêtes suivantes s'authentifient **sans interaction humaine**.
- Contrôler les échecs de login, le nettoyage, les scénarios 401/403 et la rotation éventuelle.
- Contrôler que les scripts Bruno restent valides avec la **version installée** (OpenCollection YAML ou BRU).
- La bibliothèque `agent-rules` peut seulement tester les snippets avec de faux objets `pm` et `bru` ; elle ne possède pas d'API cible à exécuter.

Références : [Postman — variables d'environnement](https://learning.postman.com/docs/use/send-requests/variables/environment-variables), [Bruno — variables runtime](https://github.com/usebruno/bruno-docs/blob/main/variables/runtime-variables.mdx), [Bruno v4 — changements de persistance](https://www.usebruno.com/v4-release).
