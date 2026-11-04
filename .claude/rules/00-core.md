# Règles fondamentales de développement

À chaque intervention, lire le **socle** : `agent/rules/01-agent.md`, `agent/rules/02-git.md`, `agent/rules/03-github.md`, `agent/rules/04-quality.md` et `agent/rules/06-security.md`.

Charger ensuite **uniquement les familles pertinentes** selon `agent/rules/25-governance.md` et `agent/docs/RULES_LOADING.md`. Une modification d'API consulte notamment les tests Postman/Bruno dans `agent/rules/17-api-testing.md` ; UI, Docker, CI, CD, release, monorepo et incidents ont leurs règles dédiées.

Issue, branche et PR ouverte par défaut. **Pas de merge implicite.** Batterie complète des tests applicables. Les déploiements Dokploy ne sont autorisés qu'au titre de `agent/rules/19-cd.md` après configuration et événement de release valide.
