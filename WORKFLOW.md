# Workflow de développement — Marmiton

## Branches et autorisations

```text
main (production)
  └── dev (intégration, créée depuis main)
       ├── feat/*
       ├── fix/*
       └── chore/*
```

- Créer une issue et une branche depuis `dev` pour chaque intervention.
- Ouvrir une PR vers `dev`. L'utilisateur a autorisé **à l'avance** la fusion vers `dev` dès que la PR est fusionnable et que les validations obligatoires ont réellement réussi. En cas de CI rouge, conflit ou protection GitHub, ne pas forcer : corriger ou signaler.
- Fermer les issues effectivement terminées et nettoyer les branches de feature après merge confirmé.
- Pour mettre en production : ouvrir une PR **depuis `dev` vers `main`**, exiger CI verte et demander une **autorisation explicite pour cette promotion**. Ne jamais merger `main` silencieusement.
- Pas de préproduction. Une fois la CD configurée et vérifiée, chaque fusion/push sur `main` déclenchera la production. Aucune CD ne doit se déclencher sur `dev`.

## CI actuellement présente

`.github/workflows/ci.yml` se déclenche sur PR et push vers `dev` et `main`. Elle exécute les validations du référentiel agent-rules, puis côté application : installation npm, génération Prisma, typecheck, lint, tests et build. Le contrôle de passage stable est `ci-required`.

**Limites actuelles :** `lint` du workspace est pour le moment un alias de typecheck, pas ESLint. Les collections Postman/Bruno ne sont pas encore exécutées dans la CI. Le schéma Prisma n'a pas encore de migration versionnée ; les tests DB et le build Docker restent à ajouter. Ne pas présenter ces contrôles absents comme validés.

Configurer sur GitHub les Rulesets des deux branches pour interdire les pushes directs, exiger des PR et le check `ci-required`. Le connecteur GitHub ne permet pas de lire les protections existantes (403) : cette étape doit être vérifiée dans les réglages GitHub.

## Déploiement production (workflow préparé, non activé)

La cible souhaitée est **Dokploy, production seule, déclenchée depuis `main` après une CI réussie**. Le job `deploy-prod` est prêt dans le workflow CI, mais désactivé par défaut (`CD_ENABLED` absent ou différent de `true`). Il ne s'exécute que pour un `push` sur `main` avec `ci-required` réussi. Aucun déploiement n'a été effectué.

Avant d'activer le job de production :

1. Définir le GitHub Environment `production` avec secrets `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` et variables `DOKPLOY_URL` et éventuellement `APP_HEALTH_URL`.
2. Vérifier la compatibilité de `agent/scripts/dokploy_deploy.sh` avec la version réelle de Dokploy, l'identifiant du nouveau déploiement et les états terminaux.
3. Construire la CD dans le même workflow, conditionnée par `needs: ci-required` et `github.ref == 'refs/heads/main'` ; ne pas réutiliser un contrôle vert d'un autre SHA.
4. Tester la méthode de rollback, la stratégie de migration et les sauvegardes avant la première activation. Ne jamais pointer de collections de test sur la production.

La politique demandée est enregistrée dans `.agent/project-policy.yml`, avec une extension locale documentée qui ne modifie pas les règles canoniques du template.

### Activer la CD Dokploy

Les paramètres fournis dans GitHub sont :
- secrets : `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` ;
- variable : `DOKPLOY_URL` (URL HTTPS de l'instance Dokploy).

Configurer également, au même niveau que ces paramètres (ou dans l'environnement GitHub `production`) :
- `APP_HEALTH_URL` (facultative pendant cette phase) : URL HTTPS de disponibilité HTTP de l'application, par exemple `/api/health`. Sans elle, le job ne valide pas la santé de l'application.
- `CD_ENABLED` : laisser absent ou `false` jusqu'à la vérification de la source Git Dokploy, du format de réponse de l'API Dokploy et du rollback. Passer à `true` uniquement après cette vérification.

**Contrôle de version temporairement suspendu à la demande du propriétaire.** Le script spécifique `scripts/dokploy_deploy.sh` exige la branche `main`, l'identifiant du nouveau déploiement et son succès terminal. Il ne vérifie **pas** le SHA servi et ne doit jamais annoncer une version exacte déployée. Les règles et scripts canoniques `agent/` restent inchangés. À l'arrivée de l'API, ajouter `/api/version` et rétablir la vérification stricte `APP_VERSION_URL` / SHA avec tests. La compatibilité du parsing Dokploy doit encore être vérifiée contre l'instance avant activation.

L'option `CD_ENABLED` protège contre les déploiements accidentels pendant le setup. Après activation, chaque fusion approuvée sur `main` entraîne automatiquement la tentative de déploiement, sans fusion automatique sur `main`. Pour une protection supplémentaire, configurer l'environnement GitHub `production` (restrictions aux branches `main`, éventuelle approbation).
