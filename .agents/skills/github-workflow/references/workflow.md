# Matrice de cycle de vie GitHub

| Étape | Conditions de réussite | En cas d'échec |
| --- | --- | --- |
| Issue | existante réutilisée ou créée, critères définis | ne pas créer de doublon |
| Branche | bonne base, pas de changements locaux écrasés | inspecter et signaler |
| PR | cible correcte, CI effective, lien vers ticket | laisser ouverte |
| Merge | autorisation explicite et état `merged` vérifié | ne pas annoncer la fusion |
| Issues | fermer seulement celles réellement terminées | signaler les suivis encore ouverts |
| Branches | suppression confirmée et aucune autre PR | fournir une commande précise, sans prétendre l'avoir exécutée |

## Choix du workflow

Respecter `.agent/project-policy.yml` si valide, mais vérifier les autorisations de l'opération **courante**. Le mode simple sans issue/branche/PR n'est pas implicite. Ne pas traiter `Refs #N` comme fermeture GitHub automatique; une PR vers `dev` ne clôt pas nécessairement les tickets.

## Rapport

Indiquer base, HEAD, PR, vérifications, état de merge, issues fermées et branches supprimées, avec preuves séparées.

