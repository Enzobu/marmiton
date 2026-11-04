# Testing des API — Postman et Bruno

> **Obligatoire pour toute API HTTP développée ou modifiée.** Ces règles complètent [les règles de testing](05-testing.md) et [les règles backend](08-backend.md). Elles concernent chaque service exposant des endpoints HTTP, y compris un backend de monorepo. La CI doit appliquer `rules/18-ci.md` ; aucune CD n'est autorisée.

## AT01 — Deux outils obligatoires

Toute création ou modification d'une API HTTP doit maintenir **les deux suites**, **Postman ET Bruno**, dans le même commit ou la même PR que le code. L'absence préalable de collections ne dispense pas de les créer.

## AT02 — Arborescence standard

À la racine du projet applicatif, créer les deux dossiers suivants :

```text
testing/
├── postman/
│   ├── <nomProjet>.postman_collection.json
│   └── <nomProjet>_local.postman_environment.json
└── bruno/
    ├── opencollection.yml
    ├── environments/
    │   └── <nomProjet>_local.yml
    └── <groupes-fonctionnels>/
        ├── folder.yml
        └── <scenario>.yml
```

L'exemple Bruno ci-dessus est pour **OpenCollection YAML** (format par défaut des versions récentes). Une collection Bruno **native .bru** reste acceptable lorsque la version du projet l'exige :

```text
testing/bruno/
├── bruno.json
├── collection.bru
├── environments/
│   └── <nomProjet>_local.bru
└── <groupes-fonctionnels>/
    └── <scenario>.bru
```

Chaque arborescence doit être **une vraie collection importable**, pas une structure décorative. Adapter les fichiers descriptifs exactement au format/version retenu; ne pas mélanger YAML et BRU arbitrairement au sein d'une collection. Garder les tests dans les formats natifs de l'outil (scripts/assertions). L'arborescence de référence est illustrative, pas une obligation de noms de fichiers pour chaque scénario.

## AT03 — Nommage

Utiliser le **nom technique canonique du projet** pour nommer collection et environnement; remplacer seulement les caractères interdits des systèmes de fichiers et préserver un nom stable. Exemple : `ridebook_local`. Dans un monorepo avec plusieurs APIs autonomes, une paire de collections par service est requise : `testing/<service>/postman` et `testing/<service>/bruno` si une arborescence multi-service est nécessaire; sinon garder `testing/postman` et `testing/bruno` à la racine. Documenter toute adaptation.

## AT04 — Un seul environnement initial

Créer **exactement un environnement versionné par outil**, appelé **`<nomProjet>_local`**, par défaut. Ne pas générer staging, preprod, production, dev ou autres environnements sans demande explicite. Garder le même nom dans Postman et Bruno.

## AT05 — Variables communes

Définir à minima `baseUrl` dans chacun des deux environnements, dirigé vers l'API locale (avec port, protocole et préfixe éventuel). Utiliser `{{baseUrl}}` pour toutes les requêtes. Prévoir, si nécessaires, `accessToken`, `refreshToken`, identifiants de ressources et autres variables de scénario avec les **mêmes noms sémantiques** dans les deux outils. Ne jamais figer un port ou un préfixe différent de la configuration réelle de l'API.

## AT06 — Données sensibles

Aucun token réel, mot de passe réel, clé API, cookie ou donnée personnelle ne doit être committé. Les valeurs sensibles doivent être absentes, vides, désactivées ou remplacées par des placeholders non fonctionnels; documenter la configuration locale des secrets par les fonctions de l'outil ou variables du processus. Ne pas copier les secrets dans l'historique, les exemples de réponses ou les résultats de tests.

## AT07 — Exhaustivité des routes

Représenter **chaque endpoint HTTP exposé** et chaque méthode réellement supportée dans **les deux** collections, y compris les endpoints de santé ou techniques lorsque leur comportement fait partie de l'API testable. Garder verbes, chemins, query, headers, body et règles d'auth conformes à l'implémentation. Une route nouvelle ou modifiée oblige à actualiser les deux suites dans la même intervention.

## AT08 — Cas nominaux

Créer des scénarios de succès significatifs pour chaque opération : lecture, liste, création, mise à jour partielle/complète, suppression et actions métier selon l'API. Valider code HTTP, schéma ou structure, types, contenu métier important et effets observables. Une assertion limitée à « 2xx » est insuffisante lorsqu'une réponse spécifique est attendue.

## AT09 — Cas d'erreur

Couvrir **tous les scénarios d'erreur pertinents** pour les endpoints concernés : données absentes, types invalides, formats invalides, violations de contraintes, authentification absente/incorrecte/expirée, accès interdit, ressource inexistante, conflit ou doublon, paramètres hors plage, pagination invalide et erreurs métier documentées. Ne pas inventer des erreurs non supportées; aligner statuts et payloads sur le contrat réel. Exclure les tests artificiels de 500 générés par une dégradation volontaire du service.

## AT10 — Assertions exécutables

Chaque scénario doit inclure des assertions **réellement exécutables** dans l'outil correspondant, vérifiant statut et propriétés déterminantes du corps, en-têtes ou état. Utiliser la syntaxe Postman native et la syntaxe Bruno native; ne pas copier aveuglément des scripts Postman dans Bruno. Les scripts doivent échouer lorsque le contrat est violé.

## AT11 — Isolation et reproductibilité

Préférer des données de test locales, dédiées et non sensibles, avec identifiants uniques et préconditions contrôlées. Utiliser setup/teardown ou nettoyage lorsque la suite crée des données. Éviter de rendre les tests dépendants d'un état de base préexistant, d'IDs fixes ou de l'ordre des requêtes sans dépendance documentée. Ne jamais lancer des scénarios destructeurs contre un environnement non local sans autorisation.

## AT12 — Authentification et rôles

Pour une API sécurisée, couvrir la connexion/obtention du jeton si exposée, la transmission des credentials, les réponses 401/403, l'expiration ou invalidité selon le contrat et les accès entre propriétaires/tenants lorsque pertinents. Aucun contournement de l'auth n'est autorisé dans l'API pour faire passer les collections.

## AT13 — Parité des outils

Construire une **matrice de couverture unique** route + méthode + scénario + résultat attendu; maintenir le même ensemble de scénarios dans Postman et Bruno. Un test présent dans un outil et absent de l'autre doit être ajouté ou justifié explicitement dans la PR (par exemple limitation technique documentée). Éviter d'utiliser un simple export/import comme preuve de parité sans vérifier les scripts et environnements.

## AT14 — Organisation lisible

Classer les requêtes par ressource ou domaine métier, puis par scénario ou cas de succès/erreur. Employer des noms explicites : `GET /users — 200 liste`, `POST /users — 400 email invalide`, etc. Ne pas multiplier les collections pour contourner la structure demandée.

## AT15 — Documentation de lancement

Ajouter à `testing/README.md` les prérequis de l'API locale, commande de démarrage de l'API, URL et variables à compléter, procédures pour **importer et exécuter Postman et Bruno**, restrictions sur les données de test et nettoyage éventuel. Décrire les commandes CLI uniquement après vérification de leur disponibilité et de leur syntaxe pour la version utilisée.

## AT16 — Contrôle du format

Produire un fichier **Postman Collection JSON conforme à un schéma de collection supporté** (v2.1 pour compatibilité courante, ou format plus récent réellement supporté par la cible) et un fichier d'environnement Postman JSON valide. Bruno doit utiliser des fichiers natifs OpenCollection YAML ou .bru cohérents et valides. Ne pas se contenter de JSON/YAML syntaxiquement valides : vérifier également l'import dans les outils lorsque disponibles.

## AT17 — Exécution complète obligatoire

Dans le cadre de la batterie de validations de [T01](05-testing.md), **exécuter intégralement les collections Postman et Bruno** contre l'API locale fonctionnelle avec `<nomProjet>_local`. Employer les outils d'exécution adaptés et disponibles, tels que Newman/Postman CLI et Bruno CLI, ou les runners applicatifs. Exécuter ces suites localement **et dans la CI** conformément à `rules/18-ci.md`; ne configurer aucune CD. Si la cible locale ou le runner manque, marquer chaque suite « impossible à exécuter », jamais « validée ».

## AT18 — Résultats traçables

Reporter séparément dans la PR les nombres de scénarios exécutés, réussis, échoués ou non exécutés pour Postman **et** Bruno; indiquer les causes et commandes réellement utilisées, sans inclure de secrets ou de données privées.

## AT19 — Synchronisation continue

Lors de tout changement de route, contrat, validation, auth ou logique métier observable, inspecter et actualiser les deux collections, environnements et assertions dans le même diff. Une modification du backend sans ajustement des tests API pertinents doit être justifiée.

## AT20 — Pas de faux positifs

Ne pas désactiver les assertions ou les scénarios en erreur, modifier les attentes pour cacher un bug, utiliser des mocks donnant toujours succès ou remplacer l'exécution réelle par la seule existence des fichiers.

## AT21 — Source de vérité

Aligner les collections sur le contrat réel (OpenAPI, routes, DTO, schémas et règles métier). Si OpenAPI existe, s'en servir pour inventorier les chemins, sans considérer l'export automatique comme une validation fonctionnelle.

## AT22 — Résultats d'exécution sûrs

Ne pas versionner d'exports de résultats contenant tokens, cookies, données privées, contenus dynamiques ou informations d'environnement. Ignorer les fichiers temporaires produits par les runners.

## AT23 — Capture automatique des tokens

Toute API à authentification Bearer (ou équivalent avec jeton de session exposé) doit posséder, **dans les deux collections**, une requête de login réelle qui récupère automatiquement le jeton de la réponse et le rend immédiatement disponible aux requêtes suivantes. **Aucun copier-coller manuel** n'est acceptable en fonctionnement normal. Respecter les champs et statuts réels du contrat : ne pas supposer que toutes les APIs renvoient `accessToken` au même niveau.

## AT24 — Scripts réellement natifs

**Postman** : extraire depuis `pm.response.json()`, contrôler le statut/schéma et écrire avec `pm.environment.set("accessToken", token)` dans l'environnement local actif. **Bruno** : extraire via `res.getBody()` puis **`bru.setVar("accessToken", token)`** en variable runtime, résolue dans les requêtes avec `{{accessToken}}`. **Ne jamais utiliser `bru.setEnvVar` pour des tokens**, car Bruno v4 persiste ce type d'écriture sur disque, exposant le secret dans un fichier versionnable. Ne pas confondre la parité **fonctionnelle** des variables entre outils avec leur mécanisme de stockage, volontairement distinct et plus sûr. <nomProjet>_local reste l'unique environnement de configuration versionné. Lire [le guide d'authentification](../docs/API_AUTH.md).

## AT25 — Bearer sur les requêtes protégées

Mettre l'auth Bearer au niveau collection/dossier lorsque la hiérarchie des requêtes le permet et utiliser `{{accessToken}}` sans dupliquer des tokens en dur. Prévoir l'absence volontaire d'auth pour login, endpoints publics et scénarios 401/403 spécifiques; ne pas injecter automatiquement un token valide dans des tests qui doivent en être dépourvus.

## AT26 — Workflow fiable

La collection complète doit effectuer login et vérification du jeton **avant** les scénarios protégés, dans le runner de Postman et celui de Bruno. Documenter les dépendances, l'ordre, les fixtures et le lancement individuel : une requête protégée isolée sans session doit donner une erreur utile ou proposer d'exécuter la requête de login, sans recopier un token.

## AT27 — Erreurs et nettoyage

Avant un nouveau login, après un login échoué ou à la déconnexion, invalider/supprimer les anciennes variables de jeton de l'outil concerné. **Ne jamais réutiliser silencieusement un token précédent** lorsque les credentials sont erronés. Si le contrat utilise une révocation côté API, vérifier aussi son comportement.

## AT28 — Refresh si disponible

Si l'API possède un endpoint de refresh, créer des scénarios nominaux/erreurs dans **les deux outils**, capturer automatiquement le nouveau `accessToken` et le `refreshToken` tournant si présent, et remplacer les anciens jetons. Un renouvellement pre-request à la demande n'est permis que s'il est fiable, limité à **une tentative par requête** et ne masque jamais un 401 inattendu.

## AT29 — Sécurité des valeurs

Ne jamais committer de token généré, ni exposer dans logs, exports Postman, fichiers d'environnement Bruno, artefacts CI ou screenshots. Avec Postman, les variables d'environnement écrites par script peuvent persister et se synchroniser selon les permissions : privilégier les valeurs locales/non partagées et vérifier **avant commit/export**. Bruno : variables runtime `bru.setVar` obligatoires pour les tokens, et non `setEnvVar`.

## AT30 — Auth multi-rôles

Si plusieurs rôles, tenants ou propriétaires doivent être testés, prévoir des logins/jetons runtime séparés avec les mêmes noms dans les deux outils (`userAccessToken`, `adminAccessToken`, etc.), et tester les interdictions 403 et 401 sans écrasement de contexte. N'ajouter les rôles que s'ils existent réellement.

## AT31 — Secrets et CI

Credentials de test non sensibles ou injectés via variables privées du runner; jamais stockés en clair dans les collections. La CI exécute le login réel contre l'API **locale de test** avant les scénarios protégés dans Postman **et** Bruno. Les secrets sont isolés par run; aucune dépendance à un token persisté d'un run précédent.

## AT32 — Parité et compatibilité vérifiées

Maintenir dans les deux formats natifs la même matrice login, récupération, utilisation, refresh si disponible, erreurs, logout, rôles et nettoyage. Tester explicitement le format Bruno du projet (OpenCollection YAML ou BRU), la version du runner et la syntaxe des scripts : un script Postman copié dans Bruno, un `bru.setEnvVar` persistant ou une variable non résolue doit faire échouer la validation. Toute incompatibilité doit être signalée plutôt que masquée.

## Références de formats

- Postman : [schémas de collection](https://schema.postman.com/) et [import/export](https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data).
- Bruno : [formats BRU et YAML](https://github.com/usebruno/bruno/blob/main/.claude/rules/dsl-changes.md) et [OpenCollection](https://www.usebruno.com/opencollection).
