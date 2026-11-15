# Développement et déploiement de Marmiton

## Branches

Créer un ticket et une branche depuis `dev`, puis ouvrir une PR vers `dev`. La fusion sur `dev` est autorisée si les contrôles obligatoires passent et que la PR est fusionnable. Fermer le ticket et nettoyer la branche après fusion. La promotion `dev` → `main` et le déploiement qui en découle exigent une autorisation explicite distincte.

La CI applique les migrations sur MariaDB, charge deux fois le seed, exécute le typecheck, le lint, les tests et les collections Postman et Bruno, puis construit les images. Elle vérifie aussi le proxy, le CORS, la restauration et le SHA servi par l’image API. Le contrôle obligatoire est `ci-required`.

## Lancement local

Copier `.env.example` vers `.env`, renseigner les identifiants MariaDB, créer les deux chemins absolus et préparer leurs permissions. Le service API écrit dans `UPLOADS_PATH` sous l’UID 1000. MariaDB utilise son propre répertoire, séparé des fichiers envoyés.

```sh
docker compose up -d --build
```

Le front est servi sur `http://localhost:8080`. Avec `VITE_API_URL=/api`, le Nginx du front relaie les requêtes vers l’API interne. La base démarre d’abord et le conteneur API applique les migrations versionnées avec `prisma migrate deploy` avant d’écouter. La commande d’initialisation du propriétaire et les fixtures sont décrites dans [testing/README.md](testing/README.md).

## Production avec Nginx Proxy Manager

Dans Dokploy, choisir Docker Compose avec une source Git sur `main`, puis sélectionner `docker-compose.yml`. Créer les chemins hôtes sous `/etc/dokploy_volume/marmiton/` selon `.env.example`, avec les permissions du compte de chaque conteneur. Le service MariaDB reste joignable uniquement sur le réseau Compose.

- Router `marmiton.enzo-palermo.com` via Nginx Proxy Manager vers le service `web` sur le port conteneur 80.
- Router `marmiton-api.enzo-palermo.com` vers `api` sur le port conteneur 3001 sans ouvrir ce port sur Internet. Si NPM passe par Traefik, conserver les deux noms d’hôte et les routes Dokploy correspondantes. Si NPM joint directement une autre machine, utiliser une adresse privée et limiter par pare-feu l’accès au port publié à la machine NPM.
- Configurer `VITE_API_URL=https://marmiton-api.enzo-palermo.com` dans Compose avant le build du front.
- Configurer `CORS_ORIGIN=https://marmiton.enzo-palermo.com`, `PUBLIC_WEB_URL=https://marmiton.enzo-palermo.com` et les paramètres `SMTP_*` côté API. Augmenter au besoin la limite de corps du proxy API à 4 Mo pour les photos encodées en JSON. Conserver HTTPS sur les deux hôtes publics.
- Pour une boîte OVHcloud MX Plan ou Zimbra en Europe, utiliser `SMTP_HOST=ssl0.ovh.net` et `SMTP_PORT=465`. Pour Email Pro, utiliser le serveur `proN.mail.ovh.net` indiqué dans le Manager et le port `587`. Renseigner l’adresse complète de la boîte dans `SMTP_USER` et son mot de passe dans `SMTP_PASSWORD`.
- Vérifier dans le navigateur le catalogue, la connexion, puis un appel authentifié. Les collections de test utilisent la MariaDB de CI ou une instance locale isolée.

### Déploiement et version

Dans l’environnement GitHub `production`, configurer les secrets `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` ainsi que les variables `DOKPLOY_URL` et `APP_VERSION_URL=https://marmiton-api.enzo-palermo.com/api/version`. Restreindre cet environnement à `main`. La CI déclenche le déploiement depuis un push sur `main` après ses contrôles. Éviter un second déclencheur automatique Dokploy sur le même push.

Construire l’API depuis le checkout Git Dokploy, avec BuildKit et le répertoire `.git` présent dans le checkout. Le Dockerfile inscrit le SHA de ce checkout dans l’image, et l’API le sert avec un contrôle de connexion MariaDB. Le job attend la fin du déploiement correspondant puis compare le SHA à celui qui a passé la CI. Un contexte sans métadonnées Git sert 503 sur `/api/version`. Vérifier sur l’instance Dokploy que le checkout garde ces métadonnées et que la réponse de `compose.deploy` fournit l’identifiant de déploiement attendu.

### Sauvegarde, restauration et migrations

Avant une promotion qui ajoute une migration, suspendre les écritures en arrêtant le service API et sauvegarder ensemble MariaDB et le répertoire de fichiers. Le dump ci-dessous récupère le mot de passe dans le conteneur DB. Enregistrer les archives hors du répertoire monté et limiter l’accès, car elles contiennent les données et les informations d’authentification.

```sh
umask 077
docker compose stop api
docker compose exec -T db sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" exec mariadb-dump --single-transaction -uroot "$MARIADB_DATABASE"' > database.sql
tar -C /etc/dokploy_volume/marmiton/uploads -czf uploads.tar.gz .
```

Pour valider un retour arrière, créer une pile isolée avec une base et des chemins de bind mount vides. Importer le dump dans cette base et extraire l’archive de fichiers dans le nouveau répertoire d’uploads. Démarrer une image de la révision qui a produit la sauvegarde et vérifier les migrations déjà appliquées, l’ouverture d’une recette, son image et les parcours protégés. Pour reprendre l’exploitation après sauvegarde, redémarrer l’API ou lancer le déploiement validé. La restauration de la production demande une autorisation dédiée. La CI reproduit l’import MariaDB et vérifie le lien entre une ligne restaurée et son fichier.
