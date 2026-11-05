---
name: github-workflow
description: Exécute les étapes GitHub d'une intervention du ticket à la PR, puis merge et nettoyage seulement sur demande.
---

# github-workflow

## Quand l'utiliser

Demande de développement avec ticket, branche, PR, merge ou nettoyage GitHub.

## Règles à lire

- `rules/02-git.md`
- `rules/03-github.md`
- `rules/21-release.md`

## Inspection initiale

1. Lire `.agent/project-policy.yml` et les protections/règles GitHub réellement accessibles; appliquer ses seules dérogations explicites.
2. Chercher les issues et PR existantes puis identifier la branche par défaut et `dev` si elle existe.
3. Vérifier les fichiers non commités, les écarts Git et les validations disponibles.

## Procédure

1. Créer ou reprendre une issue structurée : contexte, critères d'acceptation et périmètre.
2. Créer une branche dédiée depuis `dev` si présente, sinon la branche par défaut, sauf politique locale approuvée.
3. Modifier uniquement le périmètre, revoir le diff, exécuter la batterie de validations disponible, puis committer avec un message explicite.
4. Ouvrir une PR non draft vers la branche retenue, lier l'issue avec une référence adaptée à sa branche cible; rapporter les résultats réels.
5. **Uniquement si l'utilisateur demande la fusion**, vérifier GitHub Actions et protections, merger et relire l'état `merged`.
6. Après merge confirmé : fermer chaque issue réellement terminée, supprimer la branche fusionnée si accessible, jamais `main`, `dev`, `pre-prod`, protégées ou utilisées; vérifier chaque opération.

## Critères de validation

- Issue, branche, commits, PR et SHA correspondent bien à l'intervention.
- Tests, merge et suppression sont séparément marqués réussis, échoués ou non exécutés.
- Ne jamais annoncer une suppression/fermeture uniquement parce que le merge a réussi.

## Garde-fous

Pas de force push ni suppression avant merge. Une politique simple peut dispenser de PR uniquement si une exception spécifique a été approuvée; elle ne constitue pas une autorisation permanente de fusion ou de déploiement.

## Référence détaillée

Consulter [la procédure et la checklist](references/workflow.md).
