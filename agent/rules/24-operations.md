# operations

> Règles conditionnelles : appliquer uniquement aux projets et interventions concernés.

## OPS01 — Constater avant agir

Sur incident, collecter erreur, horodatage, logs et état réel des services avant de modifier quoi que ce soit.

## OPS02 — Ressources

Inspecter CPU, RAM, espace disque, inodes et I/O lorsque cela peut expliquer l'incident, particulièrement sur hôtes Docker partagés.

## OPS03 — Chaîne réseau

Distinguer DNS, proxy, TLS, réseau Docker, firewall, VPN et application avant toute modification réseau.

## OPS04 — Conteneurs

Vérifier health, restart count, dépendances et logs; ne pas relancer ou reconstruire indistinctement tous les conteneurs.

## OPS05 — Données hôtes

Identifier tous les bind mounts et leurs chemins réels avant intervention; ne pas supprimer de volumes, fichiers de données ou backups.

## OPS06 — Backups cohérents

Respecter la méthode hôte existante pour arrêter/redémarrer les bases ou conteneurs lorsque nécessaire, sans automatisation concurrente ni interruption non autorisée.

## OPS07 — Impact

Avant une action pouvant provoquer une coupure, annoncer l'impact et demander confirmation si le service est utilisé par d'autres.

## OPS08 — Réversibilité

Préparer plan de retour arrière et sauvegarde vérifiée pour les modifications sensibles.

## OPS09 — Validation après incident

Vérifier disponibilité, métriques, logs et fonctionnalité à l'origine de l'incident; ne pas confondre conteneur running et service sain.

## OPS10 — Rapport d'incident

Restituer cause établie vs hypothèse, actions effectuées, données conservées et mesures préventives proportionnées.
