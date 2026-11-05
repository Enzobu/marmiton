---
name: monorepo-management
description: Gère les workspaces, dépendances et contrats API MQTT WebSocket entre applications d'un monorepo.
---

# monorepo-management

## Déclenchement

Utiliser lors des interventions concernées, selon les contraintes du dépôt et les outils réellement disponibles.

## Règles canoniques à lire

- `rules/23-monorepo.md`
- `rules/14-packages.md`
- `rules/05-testing.md`
- `rules/16-stacks.md`

## Procédure

1. Lire manifests, workspace, gestionnaire et lockfile canonique existants.
2. Cartographier les packages touchés et consommateurs transitifs (REST, DTO, événements MQTT, WebSocket, base).
3. Ne modifier que les packages concernés et préserver les versions/dépendances internes cohérentes.
4. Vérifier les contrats producteurs et consommateurs; migrer les deux côtés en cas de rupture.
5. Utiliser le gestionnaire réel et les bons filtres workspace depuis la racine appropriée.
6. Exécuter tests des packages touchés et contrôles globaux obligatoires; signaler les scripts absents.

## Conditions de réussite

- Aucun lockfile concurrent ni cycle de dépendances introduit.
- Services/clients affectés et tests de contrats synchronisés.
- Les builds/CI du monorepo sont réellement passés ou indiqués non exécutés.

## Garde-fous

Ne jamais migrer ou déployer l'ensemble d'un monorepo pour une simple correction sans autorisation spécifique.

## Référence opérationnelle

Consulter [la checklist](references/workspace-checklist.md) avant livraison.
