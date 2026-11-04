# monorepo

> Règles conditionnelles : appliquer uniquement aux projets et interventions concernés.

## MR01 — Cartographier le workspace

Lire le manifeste racine, le gestionnaire de paquets, les packages et leurs dépendances avant modification.

## MR02 — Gestionnaire unique

Respecter pnpm/npm/yarn/composer/pub existant et le lockfile canonique, sans créer de lockfiles concurrents.

## MR03 — Cible explicite

Exécuter scripts et commandes depuis le répertoire correct ou via le filtre workspace approprié; ne jamais présumer que la racine est un package applicatif.

## MR04 — Dépendances internes

Respecter les contraintes de versions internes, éviter cycles et modifier les consommateurs d'une interface partagée.

## MR05 — Contrats partagés

Après modification d'un DTO, type, événement MQTT, message WebSocket ou schéma, vérifier les producteurs, consommateurs et validations associées.

## MR06 — Tests complets

Lancer la batterie complète de tous les packages affectés et les validations globales requises, sans n'exécuter que le service modifié lorsqu'un contrat commun change.

## MR07 — Configuration par service

Garder les variables et chemins de données propres aux services; documenter chaque .env.example adapté au workspace.

## MR08 — Docker Compose multi-services

Préserver réseaux, noms de services, dépendances de disponibilité et bind mounts hôtes, sans volumes Docker gérés.

## MR09 — Diff limité

Ne pas reformatter ni réinstaller les dépendances de packages non concernés sans justification.

## MR10 — CI par package

Adapter matrices et jobs à chaque stack du monorepo, mais bloquer la PR sur tout contrôle applicable requis.
