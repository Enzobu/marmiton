---
name: project-rules-configurator
description: Adapte explicitement les conventions Git et le niveau de workflow d'un projet simple, standard ou production.
---

# Project Rules Configurator

**Déclencher** à la création d'un projet ou lorsqu'un utilisateur souhaite adapter la politique GitHub/CI à un dépôt existant.

## Préparation

Lire `AGENTS.md`, `rules/01-agent.md`, `rules/02-git.md`, `rules/03-github.md`, `rules/06-security.md`, `rules/25-governance.md` et [les profils](references/profiles.md).

1. Inspecter le dépôt en **lecture seule** : branche par défaut, dev/pre-prod, protections GitHub si accessibles, PR ouvertes, stack, CI/CD, tests et consignes locales.
2. Proposer un **profil simple, standard ou production**, en expliquant les exceptions exactes au workflow global. Le profil n'accorde jamais à lui seul d'autorisation.
3. Recueillir une **validation explicite de l'utilisateur** avant de permettre un commit direct sur `main`, de ne pas créer d'issues/branches ou de désactiver des PR.
4. Générer le fichier du projet `.agent/project-policy.yml` avec [le configurateur](scripts/configure.py) : simulation par défaut; écriture seulement avec `--write`.
5. Pour le commit direct sur `main`, exiger `--allow-direct-main --approval DIRECT_MAIN_APPROVED` **en plus de l'accord utilisateur réel**. Le script n'autorise aucun contournement des protections GitHub.
6. Au début des interventions suivantes, lire le fichier de politique du **projet cible**, puis appliquer uniquement les exceptions de workflow approuvées. Toutes les règles de sécurité, protection des données et validation des tests demeurent applicables.
7. En cas de migration d'une politique existante, analyser le diff et demander accord avant `--replace`. Ne jamais modifier le référentiel canonique pour personnaliser un projet.

## Limites

- Aucun merge, déploiement, force push ou suppression de données sans autorisation spécifique à l'action.
- Ne jamais contourner les protections réelles des branches; signaler les conflits.
- Ne pas inférer un accord de la taille du projet ou du simple choix du profil.
- Ne pas déclarer un contrôle réussi sans l'exécuter.

## Exemple

```bash
python3 skills/project-rules-configurator/scripts/configure.py --repo . --profile simple
python3 skills/project-rules-configurator/scripts/configure.py --repo . --profile standard --approval POLICY_APPROVED --write
```

Le script n'effectue aucun commit ni opération GitHub : il propose ou écrit seulement une configuration locale.

## Template V3

Si le dépôt vient du template GitHub `agent-rules`, initialiser avec `bash agent/scripts/init.sh --profile standard` puis `--write` après approbation. Ne pas créer d'initialiseur Python. Les Rules et Skills canoniques sont dans `agent/`.
