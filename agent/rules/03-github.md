# github

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## H01 — Issue systématique

Créer ou reprendre une issue GitHub pour chaque intervention.

## H02 — Déduplication

Rechercher issues et PR déjà existantes avant création.

## H03 — Titre utile

Nommer l'issue par problème ou résultat attendu.

## H04 — Issue structurée

Préciser contexte, objectifs, périmètre et critères d'acceptation.

## H05 — Traçabilité

Relier issue, branche, commits et PR.

## H06 — Cible PR

Ouvrir vers dev si elle existe, sinon branche par défaut, sauf instruction.

## H07 — Description PR

Inclure changements, raison, tests, risques et limites.

## H08 — Issue liée

Utiliser Refs #N ou Closes #N selon effet réel du merge.

## H09 — Contrôles

Consulter les statuts de validation disponibles sans affirmer un résultat absent.

## H10 — Protections

Ne pas contourner les protections de branches configurées.

## H11 — PR lisible

Garder chaque PR ciblée et raisonnablement révisable.

## H12 — Fusion sûre

Ne pas merger en présence de validations obligatoires échouées.

## H13 — Review authentique

Ne jamais simuler une approbation humaine.

## H14 — Commentaires

Traiter les retours de review pertinents ou justifier le désaccord.

## H15 — Clôture systématique des issues terminées

Après merge **confirmé** et satisfaction des critères d'acceptation, **fermer systématiquement toutes les issues de l'intervention réellement terminées** puis vérifier leur état `closed`. Employer `Closes #N` lorsque approprié, mais ne pas présumer de la clôture automatique pour une PR vers `dev` : vérifier et fermer explicitement si nécessaire. Laisser ouvertes les issues partiellement réalisées, les suivis distincts et celles dont la définition de terminé inclut encore un déploiement. Ne jamais fermer une issue simplement parce qu'une PR a été ouverte.

## H16 — Release séparée

La PR ne vaut jamais autorisation de release ni de production.

## H17 — URLs

Fournir liens d'issue, branche, PR et commits pertinents.

## H18 — Merge et nettoyage vérifiés

Après une fusion explicitement autorisée, vérifier l'état `merged` réel sur GitHub; ensuite appliquer la clôture des issues terminées (H15) et la suppression de la branche de travail mergée (G20). Vérifier chaque résultat séparément et rapporter les opérations bloquées. Ne pas déclarer tout le workflow achevé si la fermeture ou le nettoyage attendu a échoué.

## H19 — Définition de terminé

Distinguer **codé, testé, PR ouverte, mergé, déployé et vérifié en production**. Une issue de développement peut être fermée après merge sur sa branche cible lorsque ses critères sont satisfaits. Une issue de release ou de livraison n'est terminée qu'après déploiement confirmé et contrôle de santé/version. Ne pas fermer une issue de production sur simple merge. Voir [les règles de release](21-release.md).
