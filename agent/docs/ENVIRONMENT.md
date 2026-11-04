# Configuration des volumes et des fichiers .env

Les règles canoniques sont [ENV01–ENV20](../rules/20-environment.md) et [D01–D24](../rules/10-docker.md).

## Convention obligatoire

- Aucun volume Docker géré, nommé ou anonyme, **y compris pour les données temporaires**. Utiliser `tmpfs` ou la couche éphémère du conteneur pour ces dernières.
- Exclusivement des bind mounts explicites vers des chemins hôtes absolus.
- Chaque chemin hôte persistant doit venir d'une variable `*_PATH` documentée dans `.env.example`.
- Sous Dokploy : `/etc/dokploy_volume/<APP>/<donnée>` par défaut, et un sous-dossier distinct par jeu de données.
- Conserver les chemins déjà utilisés tant qu'aucune migration n'a été explicitement demandée.

## Compose : exemple

```yaml
services:
  mariadb:
    image: mariadb:11
    restart: unless-stopped
    volumes:
      - type: bind
        source: ${DB_DATA_PATH:?DB_DATA_PATH is required}
        target: /var/lib/mysql
        bind:
          create_host_path: false
  app:
    image: mon-projet:stable
    restart: unless-stopped
    volumes:
      - type: bind
        source: ${UPLOADS_PATH:?UPLOADS_PATH is required}
        target: /app/uploads
        bind:
          create_host_path: false
```

Le Compose ne contient ni `version`, ni section `volumes:` racine pour des volumes nommés. Les chemins hôtes doivent exister avant le démarrage, avec les droits adéquats. `bind.create_host_path: false` évite la création silencieuse de dossiers absents lorsque pris en charge.

## .env.example : exemple

```dotenv
# Dossier de données persistantes, présent sur l'hôte Dokploy
DB_DATA_PATH=/etc/dokploy_volume/mon-projet/mariadb
UPLOADS_PATH=/etc/dokploy_volume/mon-projet/uploads

# Secret requis dans le vrai environnement, ne jamais committer sa valeur
DB_PASSWORD=
```

Les variables utilisées par Compose ne sont pas automatiquement visibles dans le processus conteneurisé. Configurer séparément `environment:` ou `env_file:` pour les variables applicatives effectivement nécessaires.

## Sauvegardes

Le stockage sous `/etc/dokploy_volume/<APP>/...` permet d'inclure les données dans les sauvegardes de l'hôte. Respecter la politique de backup existante et les procédures de cohérence de chaque base (notamment arrêt/redémarrage des services concernés). Aucune modification de Backrest ou des conteneurs de production n'est autorisée par cette règle.

## Vérification avant livraison

1. Tous les montages persistants utilisent `type: bind`, des sources absolues non vides et des chemins documentés.
2. Toutes les variables de chemins sont présentes dans `.env.example`, avec exemples non sensibles.
3. Les dossiers hôtes existent et leurs propriétaires, UID/GID et permissions sont adaptés, sans chmod global permissif.
4. Aucun volume Docker géré n'est créé, même implicitement par l'instruction `VOLUME` d'une image.
5. Aucune migration de données, interruption de service ou modification de backup n'est réalisée sans accord.
6. Les chemins sont inclus dans la stratégie de sauvegarde de l'hôte et ne contiennent pas de traversée de chemin.
