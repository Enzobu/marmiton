# Rapport de revue

## Ordre de revue

1. **Bloquant** : sécurité, perte de données, impossibilité de déployer.
2. **Majeur** : défaut fonctionnel reproduit ou contrat cassé.
3. **Modéré** : couverture manquante, performance, accessibilité.
4. **Mineur** : maintenance et lisibilité, sans masquer les points importants.

## Format d'observation

- Gravité et chemin/ligne(s) si connus.
- Comportement actuel, condition de déclenchement, conséquence.
- Correction minimale recommandée.
- Test de non-régression pertinent.
- Statut : confirmé / probable / nécessite reproduction.

## Vérifications de fusion

Vérifier CI et tests obligatoires réellement exécutés, protections, revue humaine requise, et politique locale. **Revue favorable != autorisation de merge.**

