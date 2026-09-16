# ADR 0001 — Monolithe modulaire

## Statut

Accepté.

## Décision

Flo's Bikes utilise :

- un frontend TanStack Start ;
- un backend Node.js/TypeScript dans le même dépôt ;
- PostgreSQL ;
- des modules organisés par domaine métier ;
- des contrats frontend/API partagés lorsque nécessaire.

## Raisons

Le projet ne nécessite pas de microservices.

Cette architecture permet :

- un déploiement VPS simple ;
- des règles métier testables ;
- des frontières claires ;
- une évolution progressive.

## Conséquence

Les modules doivent garder des dépendances explicites et éviter les cycles.
