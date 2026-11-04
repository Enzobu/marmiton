# Configuration des variables d'environnement

> Applicable aux projets avec configuration par environnement, Docker et Dokploy. Référence complémentaire : [guide de configuration](../docs/ENVIRONMENT.md) et [règles Docker](10-docker.md).

## ENV01 — Exemple obligatoire

Lorsqu'une application, un service ou un script utilise des variables d'environnement, maintenir un fichier `.env.example` versionné à la racine adaptée (projet ou service autonome d'un monorepo).

## ENV02 — Inventaire complet

Représenter toutes les variables applicatives et Docker (obligatoires et optionnelles), notamment chaque chemin de données persistantes. Toute nouvelle variable implique une mise à jour simultanée de `.env.example`.

## ENV03 — Aucun secret réel

Ne jamais inscrire mots de passe, tokens, clés privées, cookies ou données personnelles dans `.env.example`. Préférer des valeurs vides et des placeholders non opérationnels.

## ENV04 — Fichiers sensibles ignorés

Ignorer `.env`, `.env.local`, `.env.*.local` et variantes contenant des secrets, tout en maintenant les exemples publics suivis. Vérifier également les fichiers déjà indexés et l'historique Git.

## ENV05 — Nommage

Utiliser `UPPER_SNAKE_CASE`, avec des noms explicites, stables et préfixés en cas d'ambiguïté entre plusieurs services.

## ENV06 — Documentation

Documenter le rôle, le caractère obligatoire ou facultatif, le format et la valeur d'exemple de chaque variable dans `.env.example` ou dans un guide associé.

## ENV07 — Validation au démarrage

Rejeter clairement les variables obligatoires manquantes. Pour les chemins de montage Compose, utiliser `${VARIABLE:?message}` afin d'éviter une source vide.

## ENV08 — Montages paramétrés

Pour **chaque bind mount persistant**, utiliser une variable d'environnement dédiée suffixée `_PATH`, présente dans `.env.example`. Interdire les chemins de montage persistants cachés en dur.

## ENV09 — Convention Dokploy

Pour une nouvelle application sous Dokploy, définir par défaut les sources hôtes sous `/etc/dokploy_volume/<APP>/<donnée>` ; `<APP>` est un identifiant stable. Ne jamais déplacer automatiquement les données d'un projet existant.

## ENV10 — Pas de volumes Docker persistants

Ne créer **aucun volume Docker géré**, nommé ou anonyme, y compris pour les données temporaires. Utiliser des bind mounts pour les données persistantes et `tmpfs` ou la couche d'écriture pour le temporaire. Exiger `type: bind` avec `source` et `target` explicites; conserver tmpfs seulement pour des usages strictement temporaires.

## ENV11 — Droits des répertoires

Vérifier que les chemins hôtes existent et que propriétaire, UID/GID et permissions correspondent aux besoins des conteneurs. Ne jamais appliquer `chmod -R 777` comme solution de facilité.

## ENV12 — Sauvegardes existantes

Conserver les chemins stables pour les sauvegardes hôtes. Ne pas modifier Backrest ou les procédures existantes d'arrêt/redémarrage des bases ou conteneurs sans demande explicite. Une arborescence sauvegardée ne garantit pas seule la cohérence d'une base en fonctionnement.

## ENV13 — Séparation des environnements

Ne pas partager secrets, bases ou chemins persistants entre local, préproduction et production. Un seul `.env.example` non sensible reste suffisant par défaut.

## ENV14 — Interpolation et injection

Distinguer les variables utilisées pour interpoler le fichier Compose de celles réellement injectées dans les conteneurs : la présence dans `.env` ne signifie pas automatiquement qu'une application reçoit la variable.

## ENV15 — Priorité des sources

Documenter et vérifier l'origine des variables (shell, fichier env, GitHub Environments, Dokploy, Compose). Ne jamais publier une sortie de `docker compose config` contenant des secrets.

## ENV16 — Changements atomiques

Tout ajout, renommage ou retrait d'une variable doit être répercuté dans le code, Compose, les scripts, la documentation, les tests et `.env.example`, avec prise en compte de la rétrocompatibilité.

## ENV17 — Validation de conformité

Contrôler les variables de montage, les chemins absolus, l'absence de tout volume Docker géré et la présence des valeurs dans `.env.example` durant les validations du projet.

## ENV18 — Chemins sûrs

Refuser les chemins vides, la racine `/` comme source de données applicatives, les traversées de chemin et les destinations inattendues. Aucune migration automatique des données.

## ENV19 — Exemples cohérents

Les chemins, ports et URLs non sensibles de `.env.example` doivent correspondre au Compose et au projet. Ne pas supposer qu'un chemin sous `/etc` existe ou est accessible sans préparation.

## ENV20 — Secrets en CI/CD

Ne jamais exposer les secrets dans logs, artefacts, commentaires ou scripts shell. Utiliser GitHub Environments pour les secrets de déploiement et le stockage secret du runtime concerné.
