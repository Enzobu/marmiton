# Triage non destructif

## État global

- Lire la liste des conteneurs avec leur statut et leurs ports.
- Examiner ressources : CPU/RAM, df -h, df -i, stockage Docker.
- Identifier le service et lire ses logs récents sans exposer de secrets.
- Inspecter State et Mounts du conteneur; surveiller les volumes implicites.

## Découpage des causes

- Disque plein : localiser les dossiers volumineux, ne pas supprimer arbitrairement.
- Réseau : distinguer DNS, TLS, Traefik, NPM, ports, WireGuard et pare-feu.
- Base : vérifier disponibilité, état de cohérence et répertoires persistants.
- Permissions : comparer UID/GID au chemin du bind mount.

## Reprise

Annonce de l'impact, accord de l'utilisateur, action ciblée, santé fonctionnelle et plan de prévention. Toute commande disruptive est hors simulation par défaut.
