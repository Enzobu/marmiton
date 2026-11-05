---
name: code-review
description: Effectue une revue de code exigeante et exploitable sur une PR ou un diff sans prétendre avoir exécuté des tests absents.
---

# code-review

## Quand l'utiliser

Demande de revue de PR, audit de diff, contrôle de sécurité ou diagnostic avant merge.

## Règles à lire

- `rules/04-quality.md`
- `rules/05-testing.md`
- `rules/06-security.md`
- `rules/25-governance.md`

## Inspection initiale

1. Lire la demande, les critères d'acceptation, la politique du projet et le **diff réel**.
2. Identifier les fichiers impactés, les contrats touchés, les migrations et les dépendances existantes.
3. Consulter les résultats CI et tests disponibles sans supposer leur succès.

## Procédure

1. Examiner d'abord bugs fonctionnels, permissions, fuite de secrets, intégrité des données, transactions et compatibilité.
2. Évaluer les non-régressions, les usages partagés, erreurs, performances et sécurité des appels externes.
3. Si possible, reproduire les anomalies sur le bon commit et indiquer les chemins/lignes exacts; sinon distinguer hypothèses et faits.
4. Regrouper les remarques par sévérité et correction attendue, éviter commentaires purement stylistiques sans impact.
5. Si l'utilisateur demande un correctif, passer par le workflow GitHub choisi, réaliser les tests et rapporter les résultats.
6. Pour les modifications UI, intégrer la revue visuelle du Skill `ui-design`; pour API, appliquer la couverture Postman et Bruno.

## Critères de validation

- Chaque anomalie citée est fondée sur du code ou un résultat observé.
- Les tests manquants/CI rouge sont signalés sans fausse approbation.
- Les suggestions sont minimales et respectent le périmètre.

## Garde-fous

Ne jamais simuler une review humaine, approuver au nom d'un tiers ou merger sur la seule base de cette revue. Ne pas exposer des secrets trouvés dans un diff.

## Référence détaillée

Consulter [la procédure et la checklist](references/review-format.md).
