# Authentification — parcours frontend (phase UI)

Les routes publiques sont :
- `/connexion` : connexion, visibilité du mot de passe, se souvenir de moi (présentation uniquement) ;
- `/inscription` : identité, email, mot de passe renforcé et confirmation ;
- `/mot-de-passe-oublie` : demande de récupération ;
- `/verification-email` : écran d'explication de confirmation ;
- `/reinitialiser-mot-de-passe` : nouveau mot de passe et confirmation.

**Aucun endpoint d'authentification n'est encore branché.** Le bouton « Explorer avec un compte de démonstration » simule un profil uniquement en mémoire React, avec une adresse `example.invalid`. Il ne reçoit pas de mot de passe et disparaît au rechargement. Les formulaires ne créent aucun compte, n'envoient aucun courriel et ne modifient aucun identifiant. Les accès protégés et la sauvegarde des favoris ne sont pas encore implémentés.

## Futur envoi OVH

L'expéditeur transactionnel défini par le propriétaire est **`no-reply@enzo-palermo.com`**, pour la confirmation d'email et les demandes de récupération. `SMTP_FROM_EMAIL` dans `.env.example` n'est qu'une valeur publique de configuration future.

Lors de l'implémentation de l'API :
- Configurer `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` et `SMTP_PASSWORD` **uniquement dans le runtime backend/Dokploy**, jamais dans Vite ou dans le dépôt ; vérifier la configuration du serveur SMTP OVH (adresse, identité expéditeur, SPF, DKIM, DMARC).
- Générer côté serveur des liens de validation/réinitialisation à usage unique, courts, expirables, **stockés sous forme hachée**, invalidés à l'utilisation ; ne jamais placer de mot de passe dans les URLs ni les logs.
- Répondre de façon non discriminante aux demandes de récupération pour éviter l'énumération des comptes et limiter les tentatives.
- Séparer les sessions réelles de l'UI fictive, implémenter cookies sécurisés HttpOnly/SameSite/HTTPS, contrôles d'accès et persistance.
- Tester intégralement les flux nominaux et erreurs dans Postman et Bruno, ainsi que l'envoi réel sur un environnement de test contrôlé.

Ne jamais considérer ces écrans comme une authentification sécurisée avant le branchement API.
