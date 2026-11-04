# Coordination des Skills et des Rules

Le référentiel contient **20 Skills opérationnels**. La règle est **un objectif métier, un Skill principal, des Skills secondaires ciblés**, jamais l'exécution systématique de toutes les procédures.

## Ordre de décision

1. **Dépôt et contexte** : lire AGENTS/CLAUDE ou instructions de projet, puis `.agent/project-policy.yml` du projet cible si présent et explicitement approuvé.
2. **Skills applicables** : sélectionner un Skill principal selon la tâche; ajouter seulement les auxiliaires nécessaires et accessibles.
3. **Rules canoniques** : charger le socle comportement/sécurité et les familles spécialisées réellement liées aux modifications.
4. **Opérations** : inventaire/diagnostic d'abord, modifications ensuite, validations après, PR selon politique; merge/déploiement seulement sur autorisation explicite pour **l'action en cours**.
5. **Rapport** : préciser ce qui a été fait par chacun des Skills, résultats et limites.

## Routage recommandé

| Requête | Skill principal | Auxiliaires possibles |
| --- | --- | --- |
| Nouveau dépôt | `project-bootstrap` | `project-rules-configurator`, `docker-setup`, `github-ci` |
| Modifier les conventions Git | `project-rules-configurator` | `github-workflow` |
| Créer une API NestJS | `nestjs-development` | `api-testing`, `database-migrations` |
| Adapter Symfony | `symfony-development` | `api-testing`, `database-migrations` |
| Refaire l'UI React | `ui-design` | `react-ui` |
| Corriger un incident Docker | `docker-troubleshooting` | `performance-audit` si métriques nécessaires |
| Monter CI/CD | `github-ci` | `dokploy-cd` uniquement si demandé |
| Mettre à jour des dépendances | `dependency-upgrade` | `security-audit` si risque prouvé |
| Auditer les performances | `performance-audit` | `react-ui`, `nestjs-development` selon stack |
| Préparer une version | `release-management` | `github-workflow`, `dokploy-cd` avec autorisations distinctes |

## Éviter les duplications

- Le Skill principal pilote la progression; les auxiliaires sont invoqués **uniquement pour leurs étapes uniques** : ne pas ouvrir deux issues ou deux PR pour la même intervention, sauf demande explicite.
- Une modification API peut nécessiter Postman et Bruno, même lorsque le Skill principal est Symfony/NestJS.
- Un audit est par défaut **non destructif et sans déploiement**. Constat, correction, validation, publication et release sont des étapes différentes.
- La politique locale peut alléger issue/branche/PR uniquement avec accord antérieur explicite; elle ne supprime pas la sécurité, les tests existants, les protections réelles ni l'accord de merge/déploiement.
- Si un Skill est inaccessible ou une commande non disponible, le signaler, sans prétendre l'avoir utilisé.
- Pour UI : les captures/recherches visuelles et l'analyse d'une maquette doivent avoir été réellement effectuées pour en revendiquer la fidélité.

## Synchronisation

Installer le catalogue via [le script de synchronisation](../scripts/sync_skills.py), après preview du diff. La présence de fichiers dans `skills/` du dépôt central ne garantit pas leur chargement natif dans un autre projet.
