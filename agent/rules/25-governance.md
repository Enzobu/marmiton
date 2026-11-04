# governance

> Règles conditionnelles : appliquer uniquement aux projets et interventions concernés.

## RG01 — Source canonique

Les règles détaillées dans rules/ sont la source de vérité; points d'entrée agents restent courts et renvoient au contexte applicable.

## RG02 — Chargement contextuel

Toujours lire le socle comportement/Git/GitHub/sécurité; charger les fichiers spécialisés seulement selon stack et intervention, sans exiger 400 règles à chaque tâche.

## RG03 — Versionnement

Taguer les versions publiées du référentiel et documenter les changements incompatibles de règles; ne pas traiter un commit non mergé comme version publiée.

## RG04 — Distribution contrôlée

Documenter la version de règles installée dans chaque dépôt consommateur et vérifier les écarts avant synchronisation.

## RG05 — Pas de synchronisation destructive

Ne jamais écraser les fichiers d'instructions propres à un dépôt lors d'une mise à jour du référentiel.

## RG06 — Tests de règles

Exécuter validation de IDs, liens, structure, YAML, scripts et tests unitaires de sécurité sans contacter des services réels.

## RG07 — Consignes contradictoires

Rechercher et corriger les affirmations devenues obsolètes dans AGENTS.md, CLAUDE.md, .claude/rules et documentation lors de chaque évolution.

## RG08 — Compatibilité agent

Distinguer détection automatique par outils et lecture de références : un simple lien Markdown ne garantit pas le chargement.

## RG09 — Évolution auditable

Chaque changement de politique passe par issue, branche, PR et validations; ne merger ni déployer sans demande explicite.

## RG10 — Essai réel

Avant généralisation, valider le comportement des règles sur un projet pilote représentatif avec Codex, Claude Code et ChatGPT, puis intégrer les écarts observés.
