# Activation Dokploy : checklist

1. Définir le mode prod seule ou prod + préprod **avec l'utilisateur**.
2. Vérifier l'existence d'un job `ci-required` réel : il doit être réussi sur le SHA **qui sera déployé**.
3. Ajouter les jobs de `templates/dokploy/deploy-jobs.yml` au workflow réel de la CI, sans job factice.
4. Configurer les GitHub Environments et leurs secrets dans la plateforme; ne jamais les versionner.
5. Vérifier le commit/digest exact et l'identité des sources Dokploy.
6. Après `POST /api/compose.deploy`, **corréler** un nouvel ID puis attendre succès terminal.
7. L'application expose un endpoint de version/health permettant de comparer le SHA effectif à `github.sha`.
8. Tester le scénario d'échec, la restauration et le retour arrière sur environnement de test.
9. Préserver les sauvegardes et les bind mounts hôtes `/etc/dokploy_volume/<APP>/...`.

## Limites du template

Le parsing API de `scripts/dokploy_deploy.sh` est un **adaptateur à vérifier**; certains schémas et versions peuvent nécessiter une modification. Refuser un déploiement déclaré réussi sans corrélation ni SHA vérifiable. La réponse 2xx au trigger ne suffit pas.

