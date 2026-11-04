# git

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## G01 — Pas de main direct

Ne pas committer sur main; exception technique documentée pour initialiser un dépôt complètement vide.

## G02 — Pas de dev direct

Ne pas committer directement sur dev.

## G03 — Branche mère

Partir de dev si elle existe, sinon de la branche par défaut, sauf consigne explicite.

## G04 — Nommage

Branches feat/, fix/, refactor/, docs/, test/, chore/, hotfix/ et slug significatif.

## G05 — Branche dédiée

Une intervention cohérente par branche.

## G06 — État initial

Inspecter statut, branche, base et changements locaux avant travail.

## G07 — Base fraîche

Se baser sur le dernier état accessible sans écraser le travail local.

## G08 — Commits atomiques

Séparer les changements logiques pour faciliter revue et rollback.

## G09 — Conventional Commits

Employer feat:, fix:, refactor:, docs:, test:, chore:, perf: ou type adapté.

## G10 — Message descriptif

Décrire la finalité; éviter « update » et « fix » seuls.

## G11 — Secrets

Examiner le diff indexé avant commit pour tokens et secrets.

## G12 — Pas de force push

Interdire force push et réécriture d'historique sans permission explicite.

## G13 — Pas de reset destructif

Interdire reset --hard, clean destructeur ou checkout écrasant des données sans permission.

## G14 — Hygiène

Exclure caches, builds, logs, artefacts et secrets non versionnables.

## G15 — Diff revu

Vérifier chaque chemin et différence avant commit.

## G16 — Conflits

Résoudre en préservant les intentions des deux côtés, sans choix aveugle.

## G17 — Historique lisible

Éviter commits sans rapport et reformattages massifs hors périmètre.

## G18 — Politique merge

Respecter squash, rebase ou merge commit tel que choisi par le dépôt.

## G19 — Merge conditionnel

PR ouverte par défaut; merge uniquement sur demande explicite, jamais par inférence.

## G20 — Suppression après fusion

Après un merge **réellement confirmé** sur GitHub, supprimer systématiquement la branche de travail distante de la PR et sa copie locale si elle est accessible. Avant toute suppression, vérifier que la branche est intégrée, non utilisée par une autre PR ou un travail en cours, et non protégée. **Ne jamais supprimer** `main`, `dev`, `pre-prod`, la branche par défaut ou une branche de release active. Ne jamais forcer la suppression d'une branche encore nécessaire. Si GitHub interdit ou empêche la suppression, le signaler honnêtement. Une PR ouverte ne déclenche aucune suppression.
