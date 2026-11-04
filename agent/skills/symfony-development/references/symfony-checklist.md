# Symfony — contrôles d'intervention

## Contrats et couches

- [ ] Route/Method correcte, contrôleur fin.
- [ ] Types PHP compatibles avec la version installée.
- [ ] Validations côté serveur, erreurs conformes.
- [ ] Rôles/Voters/ownership/CSRF si concernés.
- [ ] Services injectés et transactions atomiques.
- [ ] Doctrine et relations sans N+1 évitables.
- [ ] Si API modifiée : `testing/postman` **et** `testing/bruno`, auth automatique.

## Twig / UX

Réutiliser Bootstrap, Twig, Stimulus, Turbo, Importmap déjà présents; vérifier focus, responsive, thèmes et composants partagés.

## Commandes indicatives

`composer validate`, `php bin/phpunit` ou `vendor/bin/phpunit`, `php bin/console lint:container`, `php bin/console lint:twig templates`, `vendor/bin/phpstan analyse` : **exécuter uniquement celles prises en charge par la configuration réelle**. Ne jamais présenter ces exemples comme exécutés.

Ne pas lancer `doctrine:migrations:migrate` sur production sans autorisation; préférer l'environnement de test.

