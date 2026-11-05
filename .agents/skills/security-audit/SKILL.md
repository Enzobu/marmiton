---
name: security-audit
description: Audite les secrets, dépendances, authentification, autorisations, surface d'attaque et CI sans action destructive.
---

# security-audit

## Quand utiliser ce Skill

Lorsqu'une intervention demande une analyse ciblée selon la description, et non systématiquement pour chaque modification.

## Rules canoniques

- `rules/06-security.md`
- `rules/04-quality.md`
- `rules/08-backend.md`
- `rules/18-ci.md`

## Procédure opérationnelle

1. Fixer un périmètre explicite : dépôt, branche, dépendances, services, environnements; ne pas tester la production ou un tiers sans permission.
2. Lire les flux authn/authz, permissions, validation d'entrées, fichiers d'environnement, dépendances, journalisation, CI et configurations Docker.
3. Chercher des failles plausibles : contrôles ownership/tenant, injection, XSS/CSRF/SSRF selon stack, stockage des tokens, fuites de secrets et accès non autorisés.
4. Vérifier les alertes réelles des scanners/dependency audits; corréler avec versions et chemins d'exploitation, sans inventer une CVE ou son applicabilité.
5. Proposer des tests de non-régression (401, 403, validation, isolation) et correctifs minimaux; utiliser Postman ET Bruno pour API HTTP si le code change.
6. Classer findings par impact, preuve, reproductibilité, remédiation et résidu de risque; distinguer confirmé et hypothèse.
7. Exécuter les contrôles disponibles sans scanner intrusivement des services externes; produire un rapport sans valeurs de secrets.

## Critères de validation

- Aucun secret réel exposé dans la sortie ou la PR.
- Chaque finding comporte portée, preuve, risque et correctif actionnable.
- Les limites de visibilité et les vérifications non exécutées sont explicites.

## Limites de sécurité

Pas d'exfiltration, d'exploitation active, de scan non autorisé, de modification de permissions de production ni de publication de secrets.

## Guide de vérification

Lire [la référence](references/security-review.md) pour la matrice de preuves et le rapport.
