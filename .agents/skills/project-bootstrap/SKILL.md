---
name: project-bootstrap
description: Initialise un dépôt avec une stack cohérente, ses conventions locales, tests, configuration et documentation.
---

# project-bootstrap

## Quand l'utiliser

Création d'une nouvelle application, d'un monorepo ou mise en conformité initiale d'un dépôt existant.

## Règles à lire

- `rules/01-agent.md`
- `rules/16-stacks.md`
- `rules/20-environment.md`
- `rules/25-governance.md`

## Inspection initiale

1. Définir le besoin fonctionnel, la stack voulue, le type de dépôt et les plateformes de livraison; ne pas ajouter de stack non demandée.
2. Examiner les fichiers présents, licences, gitignore, lockfiles, scripts et CI pour éviter de supprimer un projet existant.
3. Consulter `project-rules-configurator` pour proposer un workflow local et les dérogations approuvées.

## Procédure

1. Initialiser uniquement les dossiers, gestionnaire de paquets, scripts et dépendances compatibles avec le périmètre choisi.
2. Rendre les règles et Skills effectivement accessibles à l'agent du projet sans écraser ses instructions existantes.
3. Ajouter README (pré-requis, lancement, tests), `.gitignore`, `.env.example` sans secret et configurations minimales.
4. Pour Docker, utiliser `docker-setup`; pour API HTTP, `api-testing`; pour UI, `ui-design`; ne pas installer systématiquement tout ce qui existe.
5. Créer tests de santé de base et commandes de validation pertinentes; la CI est créée selon la politique approuvée.
6. Faire tourner l'application en environnement de test si possible; vérifier son point d'entrée et les commandes de démarrage.

## Critères de validation

- Un nouvel arrivant peut installer et lancer les outils avec le README fourni.
- Les tests/linters/builds configurés sont réellement exécutés ou signalés impossibles.
- Aucun secret ni configuration personnelle n'est enregistré dans Git.

## Garde-fous

Un bootstrap n'autorise pas implicitement la publication, le push main, la création d'infrastructure payante ou un déploiement réel. Demander validation des décisions structurantes.

## Référence détaillée

Consulter [la procédure et la checklist](references/bootstrap.md).

## Template V3

Si le dépôt vient du template GitHub `agent-rules`, initialiser avec `bash agent/scripts/init.sh --profile standard` puis `--write` après approbation. Ne pas créer d'initialiseur Python. Les Rules et Skills canoniques sont dans `agent/`.
