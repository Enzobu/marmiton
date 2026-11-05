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

## Déploiement production (workflow activé dès promotion sur main)

La cible souhaitée est **Dokploy, production seule, déclenchée depuis `main` après une CI réussie**. Le job `deploy-prod` est activé : il est déclenché exclusivement par un **push sur `main`**, après réussite de `ci-required` sur ce même run. Il reste absent de `main` tant que la promotion `dev` vers `main` n'a pas été autorisée et réalisée. Aucun déploiement n'a été effectué lors de cette préparation.

Avant d'activer le job de production :

1. Définir le GitHub Environment `production` avec secrets `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` et variables `DOKPLOY_URL` et éventuellement `APP_HEALTH_URL`.
2. Vérifier la compatibilité de `agent/scripts/dokploy_deploy.sh` avec la version réelle de Dokploy, l'identifiant du nouveau déploiement et les états terminaux.
3. Construire la CD dans le même workflow, conditionnée par `needs: ci-required` et `github.ref == 'refs/heads/main'` ; ne pas réutiliser un contrôle vert d'un autre SHA.
4. Tester la méthode de rollback, la stratégie de migration et les sauvegardes avant la première activation. Ne jamais pointer de collections de test sur la production.

La politique demandée est enregistrée dans `.agent/project-policy.yml`, avec une extension locale documentée qui ne modifie pas les règles canoniques du template.

### Configurer et vérifier la CD Dokploy

Les paramètres fournis dans GitHub sont :
- secrets : `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` ;
- variable : `DOKPLOY_URL` (URL HTTPS de l'instance Dokploy).

Configurer également, au même niveau que ces paramètres (ou dans l'environnement GitHub `production`) :
- `APP_HEALTH_URL` (facultative pendant cette phase) : URL HTTPS de disponibilité HTTP de l'application, par exemple `/api/health`. Sans elle, le job ne valide pas la santé de l'application.
- Aucun flag `CD_ENABLED` n'est nécessaire : le déclenchement sur `main` est automatique dès que ce workflow y est intégré.

**Contrôle de version temporairement suspendu à la demande du propriétaire.** Le script spécifique `scripts/dokploy_deploy.sh` exige la branche `main`, l'identifiant du nouveau déploiement et son succès terminal. Il ne vérifie **pas** le SHA servi et ne doit jamais annoncer une version exacte déployée. Les règles et scripts canoniques `agent/` restent inchangés. À l'arrivée de l'API, ajouter `/api/version` et rétablir la vérification stricte `APP_VERSION_URL` / SHA avec tests. La compatibilité du parsing Dokploy doit encore être vérifiée contre l'instance avant activation.

Les PR sur `dev` ne déploient pas. Chaque fusion approuvée sur `main` entraînera automatiquement une tentative de déploiement, sans fusion automatique sur `main`. Pour une protection supplémentaire, configurer l'environnement GitHub `production` (restrictions aux branches `main`, éventuelle approbation).

## Frontend et Docker Compose (phase UI)

Le fichier Compose unique est désormais `docker-compose.yml` à la racine, et **seul** `.env.example` est versionné. Pour tester l'interface en local :

```bash
cp .env.example .env
docker compose -f docker-compose.yml up --build -d web
```

Par défaut, l'interface est accessible sur `http://localhost:8080`. Modifier `WEB_PORT` dans `.env` ou les variables Dokploy si nécessaire. `WEB_BIND_ADDRESS` permet de choisir l'interface d'écoute. Le service web fonctionne seul, avec des recettes fictives. Les images des recettes sont chargées depuis Unsplash tant que les uploads ne sont pas implémentés.

Les services `api` et `db` sont conservés sous le profil `backend` : `docker compose -f docker-compose.yml --profile backend up --build -d` après renseignement des identifiants MariaDB, préparation des chemins absolus `DB_DATA_PATH` et `UPLOADS_PATH`, et mise en place des migrations. Un démarrage en production avec la base exige aussi des sauvegardes et une revue des permissions.

**Dokploy :** sélectionner `docker-compose.yml` en configuration Compose et publier le port conteneur `80` du service `web`. Les publications de ports sur l'hôte peuvent être ajustées depuis `.env`/les variables Dokploy ; elles ne remplacent pas la configuration du routage Traefik.

**Limites CD :** le contrôle de SHA est différé à l'API. La corrélation d'identifiant de déploiement du script Dokploy n'a pas encore été testée sur l'instance réelle. Un push sur `main` pourrait donc déclencher la CD puis échouer à la vérification, ce qui devra être diagnostiqué sans prétendre que le déploiement est validé.
