# Installer et utiliser les règles

Ce dépôt constitue une **bibliothèque** : ses instructions ne s'appliquent pas automatiquement à d'autres repositories.

## Codex

Conserver `AGENTS.md` à la racine et copier `agent/rules/` dans la racine du projet (ou en assurer un accès local équivalent). Codex détecte `AGENTS.md` dans les répertoires parcourus; les fichiers liés doivent aussi être disponibles. Adapter par sous-répertoire avec des `AGENTS.md` locaux ciblés plutôt que de dupliquer toute la bibliothèque.

## Claude Code

Conserver `CLAUDE.md`, `AGENTS.md` à la racine et copier `agent/rules/` et `.claude/rules/` dans le dépôt cible. Claude Code prend en charge `CLAUDE.md` et des fichiers de règles sous `.claude/rules/`. Les filtres `paths` limitent la portée de certaines règles, sous réserve de la version utilisée. Toujours garder les chemins liés résolubles.

## ChatGPT

Dans les paramètres d'un Projet ChatGPT, copier `chatgpt/PROJECT_INSTRUCTIONS.md`. Ajouter le catalogue comme fichiers sources ou permettre un accès effectif au dépôt par un outil autorisé. Un lien seul ne garantit ni ingestion automatique, ni synchronisation, ni permissions d'écriture. Réactualiser les fichiers sources après évolution des règles.

## Politique commune

- Issue GitHub + branche + PR ouverte par défaut.
- Branche depuis `dev` lorsqu'elle existe, sinon depuis la branche par défaut.
- Fusion seulement sur demande explicite.
- Batterie complète des contrôles disponibles, avec mention explicite des contrôles non exécutables.
- Protéger les modifications locales et données réelles.

## Priorités et conflits

Respecter les contraintes de sécurité et d'outil, les demandes explicites autorisées, les conventions du dépôt cible et le présent socle; en cas de contradiction sur une action risquée, signaler le conflit avant d'agir. Une préférence générique ne doit pas casser une architecture déjà en place.

## CI et CD

La politique CI est définie dans `rules/18-ci.md` et `docs/CI.md`. Le workflow `.github/workflows/ci.yml` valide **uniquement ce dépôt documentaire**. Il ne faut pas le copier tel quel dans un dépôt applicatif : celui-ci exige une CI adaptée à sa stack et à ses propres tests. Configurer ensuite les Rulesets GitHub pour bloquer les PR en échec. La CD Dokploy est définie dans `rules/19-cd.md` et `docs/CD.md`. Avant de l'installer dans une application, demander si la préproduction est souhaitée; copier et adapter les modèles. Aucun déploiement actif n'est installé dans ce dépôt documentaire.

## Variables d'environnement et sauvegardabilité

Lire `rules/20-environment.md` et `docs/ENVIRONMENT.md`. Les projets utilisant Docker/Dokploy doivent déclarer **tous les chemins hôtes de bind mounts persistants** dans `.env.example`, et utiliser par défaut `/etc/dokploy_volume/<APP>/<donnée>` pour les nouveaux projets Dokploy. Respecter la configuration de backups et les chemins déjà utilisés, sans les déplacer automatiquement. Après merge réellement confirmé, fermer les issues terminées et supprimer les branches de travail devenues inutiles, hors branches protégées.

## V2 : lecture contextuelle

Lire `docs/RULES_LOADING.md` et `rules/25-governance.md`. Charger le socle plus les spécialisations utiles; ne pas imposer de relire tout le catalogue pour une tâche mineure. Documenter la version du référentiel installée dans chaque projet consommateur et préserver les règles spécifiques déjà en place.

## V2 : règles applicables

Utiliser [le guide de chargement contextuel](RULES_LOADING.md). La CI de ce référentiel valide le catalogue et simule les appels Dokploy : elle ne prouve pas la compatibilité de tous les schémas d'API Dokploy en production. Chaque projet doit tester ses propres valeurs, versions et healthchecks avant activation.

## Skills disponibles

Voir [docs/SKILLS.md](SKILLS.md). Les Skills dans `agent/skills/<nom>/SKILL.md` doivent être disponibles pour l'agent; si nécessaire, les installer dans le répertoire de Skills natif du client. Pour personnaliser le workflow d'un projet, lire `.agent/project-policy.yml` s'il existe avant de suivre la convention globale. Toute exception de sécurité, de protection GitHub ou d'autorisation de fusion est interdite.

## Installation du catalogue complet

Les 20 Skills sont listés dans [docs/SKILLS.md](SKILLS.md). Copier ou installer **chaque dossier Skill**, y compris ses `references/`, `assets/` et scripts. Conserver les chemins résolubles et vérifier la découverte de Skills de la version de l'agent. Les tests statiques ne remplacent pas un essai concret sur un dépôt pilote.

## Synchroniseur local de Skills

Avec une copie locale de `agent-rules`, `python3 agent/scripts/sync_skills.py --target /chemin/projet` prévisualise sans écriture; ajouter `--write` après contrôle. Spécifier `--agent codex` ou `--agent claude` pour limiter la cible; par défaut les deux. Les chemins natifs sont `.agents/skills` et `.claude/skills`. Les mises à jour sont suivies via `.agent/skills-lock.json` et **refusées si un fichier local a divergé**. Il n'y a aucune purge automatique ni action distante. Voir [le catalogue](SKILLS.md) et [la coordination](SKILL_ORCHESTRATION.md).

## Nouveau template V3 (Bash)

L'installation initiale du template s'effectue avec `bash agent/scripts/init.sh --profile standard` pour la prévisualisation, puis ajouter `--write` après contrôle. **Ce script est entièrement en Bash**, détecte les stacks principales et copie les Skills utiles dans leurs dossiers natifs sans écraser les fichiers existants. [Guide template](TEMPLATE.md). Le synchroniseur Python déjà présent reste disponible pour les mises à jour différentielles ultérieures; il n'est pas nécessaire pour l'initialisation.
