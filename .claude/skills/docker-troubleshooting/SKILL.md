---
name: docker-troubleshooting
description: Diagnostique les incidents Docker, stockage, réseau et Dokploy sans risque implicite pour les données.
---

# docker-troubleshooting

## Déclenchement

Utiliser lors des interventions concernées, selon les contraintes du dépôt et les outils réellement disponibles.

## Règles canoniques à lire

- `rules/24-operations.md`
- `rules/10-docker.md`
- `rules/11-observability.md`
- `rules/20-environment.md`

## Procédure

1. Collecter symptômes, horodatage et service réellement impacté sans déclencher de redémarrage.
2. Examiner Docker health, restart count, logs, CPU, RAM, disque, inodes et I/O.
3. Isoler réseau, TLS, reverse-proxy, DNS, firewall, VPN, service applicatif et base de données.
4. Inspecter les vrais bind mounts hôtes et UID/GID; détecter les volumes Docker gérés non conformes.
5. Proposer la correction minimale avec impact et retour arrière; obtenir accord pour toute interruption.
6. Après action autorisée, vérifier application, logs, métriques et données.

## Conditions de réussite

- Cause prouvée ou hypothèse clairement identifiée.
- Aucun changement de sauvegardes ni suppression/migration de données non demandé.
- Rétablissement vérifié fonctionnellement, pas seulement statut running.

## Garde-fous

Interdire docker system prune --volumes, down -v, chmod récursif permissif et redémarrage massif sans accord.

## Référence opérationnelle

Consulter [la checklist](references/incident-triage.md) avant livraison.
