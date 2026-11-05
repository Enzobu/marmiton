---
name: docker-setup
description: Prépare Dockerfile, Compose et .env.example sans volumes Docker gérés, avec bind mounts Dokploy et validations.
---

# docker-setup

## Quand l'utiliser

Conteneuriser une application, ajouter un service Docker, un volume ou une configuration Compose.

## Règles à lire

- `rules/10-docker.md`
- `rules/20-environment.md`
- `rules/16-stacks.md`

## Inspection initiale

1. Lire la stack, ports, services, variables d'environnement, stockage et réseaux existants.
2. Repérer les données déjà sur l'hôte, leur sauvegarde et le proxy/Dokploy en place.
3. Identifier le UID/GID réel des processus et l'existence des répertoires sources.

## Procédure

1. Créer un Dockerfile adapté, multi-stage si utile, image maintenue et contexte `.dockerignore` sans secrets.
2. Composer les services sans attribut `version`, avec `restart: unless-stopped` sauf cas one-shot justifié; réseaux et ports minimaux.
3. Interdire **tout volume Docker géré** nommé ou anonyme, même temporaire; stockage durable exclusivement en `type: bind`, temporaire en `tmpfs` si nécessaire.
4. Déclarer **chaque** source persistante comme variable `_PATH` dans `.env.example`, et utiliser `/etc/dokploy_volume/<APP>/<donnée>` par défaut pour les nouveaux projets Dokploy.
5. Utiliser `${VARIABLE:?message}` et `bind.create_host_path: false` si supporté; préparer permissions et dossiers explicitement.
6. Inspecter syntaxe Compose, images et montages effectifs; vérifier absence de volumes implicites induits par `VOLUME` de l'image.

## Critères de validation

- `docker compose config` vérifié sans publier la sortie si elle expose des secrets.
- Aucun volume Docker `type: volume` après création réelle; chaque bind source existe et est sauvegardable.
- Les applications redémarrent sans perte de données dans l'environnement de test.

## Garde-fous

Ne pas changer les bind mounts existants, déplacer des données, reconfigurer Backrest, arrêter les DB ni lancer un compose de production sans demande explicite.

## Référence détaillée

Consulter [la procédure et la checklist](references/compose-checklist.md).
