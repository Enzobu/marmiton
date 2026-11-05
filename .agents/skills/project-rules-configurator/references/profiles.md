# Profils et précédence

| Option | simple | standard | production |
| --- | --- | --- | --- |
| Issue | optional | required | required |
| Branche de travail | optional | required | required |
| PR | optional | required | required |
| Commit direct main | **false par défaut** | false | false |
| dev / pre-prod | facultatives | selon dépôt | selon projet |
| CI | facultative si absente | recommandée | requise selon politique |
| Tests existants | **obligatoires** | **obligatoires** | **obligatoires** |
| Secrets, protection des données, contrôle GitHub | **obligatoires** | **obligatoires** | **obligatoires** |

## Précédence

1. Instructions supérieures et protections effectives de GitHub.
2. Accord explicite de l'utilisateur concernant l'action présente (merge, déploiement, suppression).
3. `.agent/project-policy.yml` du projet, **uniquement pour les exceptions de workflow approuvées**.
4. Règles canoniques `rules/*.md` pour tous les comportements non modifiés.
5. Valeurs suggérées par les profils.

Le profil simple ne signifie **pas** autorisation implicite de committer directement sur main.

## Exemple

```yaml
schema_version: 1
profile: simple
git:
  issues: optional
  branches: optional
  pull_requests: optional
  direct_main_commits: false
  base_branch: auto
testing:
  run_existing_tests: true
deployment:
  mode: none
metadata:
  source: agent-rules
  configured_with_explicit_approval: true
```

N'inclure aucun token ou identifiant personnel. Conserver les conventions locales existantes sauf remplacement approuvé.

## Dérogations fines

Après inspection et accord explicite, choisir indépendamment `--issues-policy required|optional`, `--branches-policy required|optional` et `--pr-policy required|optional`. La politique locale générée ne contourne pas les protections GitHub. Le mode `--allow-direct-main` (profil simple) nécessite toujours l'accord `DIRECT_MAIN_APPROVED` et ne peut pas coexister avec des branches obligatoires.
