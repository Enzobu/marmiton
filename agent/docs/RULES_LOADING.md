# Chargement contextuel du référentiel

Lire systématiquement le **socle** `01-agent`, `02-git`, `03-github`, `04-quality` et `06-security` ainsi que les conventions locales du dépôt. Consulter ensuite uniquement les règles pertinentes.

| Intervention | Compléments |
| --- | --- |
| Développement général | `05-testing`, `12-documentation` |
| Interface / UI | `07-frontend`, `22-ui-validation` |
| Backend / API | `08-backend`, `17-api-testing`, `09-database` si nécessaire |
| Docker / .env | `10-docker`, `20-environment` |
| Intégration continue | `18-ci`, `05-testing` |
| Dokploy / release | `19-cd`, `21-release`, `20-environment` |
| Monorepo | `23-monorepo`, stacks concernées de `16-stacks` |
| Incident | `24-operations`, `11-observability` |
| Mise à jour de règles | `25-governance`, familles modifiées |

Ne pas lire toutes les technologies de `16-stacks` si elles ne concernent pas le projet. **Un lien Markdown ne garantit pas que son contenu a été lu automatiquement par tous les agents.** Conserver un point d'entrée compatible (`AGENTS.md`, `CLAUDE.md`, instructions de Projet ChatGPT), copier les ressources canoniques dans le projet ou leur assurer un accès effectif. Enregistrer la version/commit du référentiel installé et synchroniser sans écraser les instructions locales.

## Politique de projet et Skills

**Commencer par `.agent/project-policy.yml` lorsqu'il existe dans le dépôt cible** : il adapte seulement le workflow Git/GitHub approuvé. Pour l'initialiser, consulter `skills/project-rules-configurator/SKILL.md`; pour une tâche de design, `skills/ui-design/SKILL.md`. Les références dans ce dépôt ne suffisent pas à installer automatiquement les Skills; voir [docs/SKILLS.md](SKILLS.md).

## Sélection des Skills spécialisés

Voir [le catalogue complet des 20 Skills](SKILLS.md). Choisir un Skill uniquement lorsqu'il correspond à la tâche : par exemple `api-testing` pour une API, `docker-setup` pour Compose, `docker-troubleshooting` pour un incident ou `ui-design` pour une refonte visuelle. Les Rules sont des obligations; les Skills décrivent **comment les réaliser**. Ne pas charger les 17 Skills systématiquement.

## Coordination d'exécution

Les appels à plusieurs Skills suivent [la matrice d'orchestration](SKILL_ORCHESTRATION.md). Charger le minimum utile, et distinguer analyse, modification du code, tests, PR et déploiement; un Skill ne donne pas automatiquement l'autorisation d'exécuter le suivant.

## Racine du template

Les Rules et Skills ont pour racine canonique `agent/`. Depuis la racine du projet, utiliser `agent/rules/*.md`, `agent/skills/<nom>/SKILL.md` et `agent/docs/SKILLS.md`. Les chemins `rules/` dans les références internes d'un Skill sont relatifs à la bibliothèque `agent/`, non à la racine Git.
