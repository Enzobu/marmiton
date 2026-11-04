# Checklist d'activation de la CD Dokploy

- [ ] L'utilisateur a choisi prod seule ou préprod + prod.
- [ ] Les triggers de `pre-prod` ne sont présents qu'en mode dual.
- [ ] Les tags suivent `vX.Y.Z` et proviennent d'un commit de release approuvé.
- [ ] `ci-required` existe réellement dans le **même workflow** et tourne aussi sur les tags.
- [ ] Les GitHub Environments ont les secrets propres aux instances ciblées et des protections adaptées.
- [ ] Les jobs n'ont jamais de déclencheur `pull_request` pour déployer.
- [ ] `DOKPLOY_URL` est HTTPS, l'ID Compose est correct et l'API key a des permissions limitées.
- [ ] La source Dokploy correspond à la référence GitHub, et le SHA/digest final est vérifiable.
- [ ] La réponse HTTP est vérifiée; les retries automatiques de POST sont désactivés.
- [ ] La fin du nouveau déploiement est corrélée, suivie d'un healthcheck et d'une vérification de version.
- [ ] Les secrets n'apparaissent ni dans les logs ni dans les artefacts.
- [ ] La concurrence est sérialisée et les timeouts bornés.
- [ ] Les sauvegardes et une procédure de rollback existent pour les services persistants.
- [ ] Le workflow est validé par `actionlint` et son exécution réelle est observée.
- [ ] Aucune configuration du dépôt de règles ne déploie directement.

- [ ] Le schéma de réponse Dokploy expose un ID de déploiement corrélable au nouveau run.
- [ ] Le nouvel ID atteint un état terminal de réussite, sans recycler un ancien run.
- [ ] `APP_VERSION_URL` retourne le SHA exact du run CI ; toute divergence échoue.
