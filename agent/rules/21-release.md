# release

> Règles conditionnelles : appliquer uniquement aux projets et interventions concernés.

## REL01 — Stratégie explicitée

Chaque projet documente sa branche principale, dev éventuelle, préprod éventuelle, branche de release et déclencheur de production. Ne jamais supposer une promotion universelle dev → main → pre-prod.

## REL02 — Promotion par PR

Promouvoir les changements entre branches via PR traçables et validations complètes; aucune fusion implicite ni push direct sur branche protégée.

## REL03 — Tag SemVer

Utiliser par défaut les tags vMAJOR.MINOR.PATCH à partir du commit réellement approuvé; ne pas créer de tag sans demande de release.

## REL04 — Tag et SHA

Consigner le commit SHA exact du tag et le vérifier avec le déploiement effectif; ne pas supposer que le nom du tag constitue une preuve.

## REL05 — Hotfix

Partir de la branche de production appropriée, minimiser le diff, tester la correction et reporter le hotfix vers les autres branches actives sans écraser leur travail.

## REL06 — Issues de développement

Clore une issue de développement après intégration et acceptation sur la branche cible, même si le produit n'est pas encore en production, lorsque c'est bien sa définition de terminé.

## REL07 — Issues de livraison

Une issue de release ou déploiement reste ouverte jusqu'à déploiement confirmé, contrôle de santé et version vérifiée; ne pas la fermer sur simple merge.

## REL08 — Preprod facultative

Ne créer ou utiliser pre-prod que si l'utilisateur a explicitement choisi le mode double environnement.

## REL09 — Rollback versionné

Identifier la version précédente et la procédure de retour arrière, incluant migrations et compatibilité de données, avant une release à risque.

## REL10 — Journal des versions

Documenter changements significatifs, version, SHA, date, environnement cible et éventuelles migrations; aucune note de release inventée.
