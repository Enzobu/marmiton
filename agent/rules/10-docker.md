# docker

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## D01 — Pas de version

Ne jamais mettre l'attribut top-level version dans Compose.

## D02 — Restart par défaut

Ajouter restart: unless-stopped à tous les services pertinents, sauf exception demandée ou tâche one-shot justifiée.

## D03 — Images

Préférer images officielles ou vérifiables, maintenues.

## D04 — Tags

Éviter latest dans les déploiements stables.

## D05 — Multistage

Séparer build et runtime si pertinent.

## D06 — Dockerignore

Exclure caches, builds et secrets du contexte.

## D07 — Bind mounts exclusivement pour la persistance

**Interdire tout volume géré par Docker, nommé ou anonyme, y compris temporaire** (même les volumes anonymes implicites introduits par l'instruction `VOLUME` d'une image). Utiliser uniquement des **bind mounts** avec source hôte explicite. En Compose, préférer `type: bind`, `source: ${SERVICE_DATA_PATH:?required}`, `target: /...` et `bind.create_host_path: false` lorsque cette option est prise en charge. Aucun `volumes:` top-level créant des volumes nommés persistants. Pour les usages éphémères, utiliser `tmpfs` ou le writable layer ; auditer aussi les mounts réels, pas seulement le fichier Compose. Éviter toute création implicite de volumes anonymes et vérifier les mounts réellement employés.

## D08 — Réseaux

Isoler les services internes sur les réseaux adéquats.

## D09 — Ports

Limiter les publications de ports.

## D10 — Healthcheck

Vérifier santé réelle si faisable.

## D11 — Chemins hôtes dans .env.example

Externaliser la configuration. **Chaque chemin hôte de montage persistant** doit être fourni par une variable d'environnement dédiée suffixée `_PATH` et obligatoirement documentée dans `.env.example`, avec valeur d'exemple correspondant à l'hôte ciblé. Jamais de chemin de stockage persistant en dur dans Compose et jamais de remplacement par un volume Docker si la variable manque. Appliquer [les règles ENV](20-environment.md).

## D12 — Secrets

Ne pas incorporer des secrets dans image ou Compose versionné.

## D13 — Non-root

Limiter privilèges des processus.

## D14 — Cache

Optimiser couches et installation de dépendances.

## D15 — Arrêt

Gérer signaux et stop proprement.

## D16 — Logs

Préférer stdout/stderr et rotation appropriée.

## D17 — Limites

Fixer ressources quand nécessaire.

## D18 — Validation

Lancer docker compose config sans divulguer valeurs de secrets.

## D19 — Préserver les données

Ne pas utiliser `docker compose down -v`, `docker volume prune` ou une commande destructrice pour un redémarrage. Ne jamais supprimer ni déplacer des chemins hôtes contenant des données sans accord et plan de restauration; ne jamais convertir un bind mount en volume Docker géré implicitement.

## D20 — Infra existante

Respecter réseau, reverse-proxy, DNS et volumes de l'hôte.

## D21 — Dossiers Dokploy

Pour toute **nouvelle** application Dokploy, convention par défaut `/etc/dokploy_volume/<APP>/<service-ou-donnée>` avec sous-dossiers distincts et identifiant d'application stable. Ne pas déplacer automatiquement les données d'une application existante; conserver les chemins en place jusqu'à migration explicitement autorisée. Ne pas monter tout le répertoire d'autres applications dans un conteneur.

## D22 — Droits et préparation

Vérifier avant lancement l'existence, le propriétaire, les UID/GID et les permissions des répertoires hôtes. Ne pas utiliser `chmod -R 777`. Éviter les chemins relatifs et préférer `bind.create_host_path: false` pour détecter les sources manquantes.

## D23 — Sauvegardabilité

Documenter et stabiliser tous les chemins persistants pour leur inclusion dans les backups de l'hôte. Préserver la stratégie existante (dont les arrêts/redémarrages de services nécessaires à la cohérence des sauvegardes de bases). Ne jamais reconfigurer Backrest ou arrêter des conteneurs sans autorisation explicite.

## D24 — Vérifications des mounts

Avant livraison, contrôler la configuration Compose et, si possible, les montages effectifs : aucun volume Docker géré nommé/anonyme, même temporaire, chaque source est un bind mount hôte absolu référencé par `.env.example`, chemins existants, permissions adéquates et destinations correctes. Faire échouer les contrôles de conformité si un volume persistant Docker géré est introduit.
