# Checklist de démarrage

## Avant génération

- [ ] Projet neuf ou dépôt préexistant ? Faire l'inventaire, pas de réinitialisation destructive.
- [ ] Stack exacte : Symfony, NestJS, React, Flutter, monorepo, autre.
- [ ] Périmètre du MVP et environnement local.
- [ ] Profil Git explicite via `project-rules-configurator`; pas de `main` direct inféré.
- [ ] Dépendances et versions vérifiées auprès du dépôt/outillage disponible.

## Livraison

- [ ] Arborescence cohérente et un lockfile par écosystème.
- [ ] README avec installation et scripts vérifiés.
- [ ] `.env.example`, secret hors Git, tests/format/lint applicables.
- [ ] Instructions agent réellement accessibles dans le dépôt.
- [ ] Optionnel : Compose avec bind mounts, CI, CD, collections API ; déclencher les Skills correspondants, sans activation automatique de la CD.

## Preuve

Lister commandes exécutées et résultat réel; marquer la publication et le déploiement séparément.

