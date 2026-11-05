# Checklist Docker / Dokploy

## Compose

- [ ] Aucun `version:` au niveau racine.
- [ ] `restart: unless-stopped` pour chaque service de longue durée.
- [ ] Images versionnées; healthchecks pertinents.
- [ ] Aucun `volumes:` nommé au niveau racine, ni montage implicite de type volume.
- [ ] Persistant : `type: bind`, `source: ${DB_DATA_PATH:?required}`, `target` explicite.
- [ ] Temporaire : `tmpfs` seulement si approprié.
- [ ] Réseaux internes, exposition des ports minimale, pas de secrets dans les fichiers.

## Données hôtes

Par défaut pour un nouveau service Dokploy : `DB_DATA_PATH=/etc/dokploy_volume/<APP>/mariadb` dans `.env.example`. Utiliser un chemin par ensemble de données (uploads, DB, storage), éviter de monter tout le parent.

Évaluer les permissions UID/GID, l'absence de dossier vide accidentel, la sauvegarde hôte déjà existante et la cohérence DB.

## Vérifications possibles

- `docker compose config --quiet` (préférer la sortie silencieuse à la divulgation des variables).
- `docker inspect <conteneur>` : contrôler le champ `Mounts`; tout `Type=volume` est une non-conformité.
- Un `VOLUME` dans l'image peut créer un volume anonyme même si Compose n'en déclare aucun.

Aucune de ces commandes ne doit viser une production sans l'accord correspondant.

