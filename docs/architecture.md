# Architecture — Flo's Bikes

## Principe général

Flo's Bikes utilise un monolithe modulaire.

Le frontend existant reste dans `frontend/`.
Le backend sera ajouté dans `backend/`.
Les contrats partagés vivront dans `packages/contracts/`.

Aucun dossier n'est créé s'il n'a pas encore d'utilité réelle.

## Frontend

TanStack Start conserve ses routes dans `frontend/src/routes/`.

Les routes doivent rester principalement compositionnelles.

La logique métier frontend sera progressivement placée dans `frontend/src/features/`.

Les éléments réellement génériques pourront vivre dans `frontend/src/shared/`.

Le serveur reste l'autorité pour les prix, disponibilités, stocks, réservations, commandes, paiements, frais de livraison et permissions admin.

## Backend

Le backend sera organisé par modules métier dans `backend/src/modules/`.

La direction des dépendances est :

Route -> Controller -> Service -> Repository -> PostgreSQL

La route gère HTTP, middlewares, authentification et autorisation.

Le controller lit les données HTTP, appelle la validation, appelle le service et produit la réponse HTTP.

Le service contient les règles métier et ne dépend pas d'Express.

Le repository contient uniquement la persistance PostgreSQL et aucune décision métier.

## Contrats frontend/API

Les contrats partagés vivent dans `packages/contracts/`.

Ils peuvent contenir des types de requêtes, réponses, schémas publics, enums publics et codes d'erreur publics.

Ils ne contiennent jamais de secret, accès DB, configuration serveur privée ou logique interne sensible.

Format de succès :

`{ "data": ... }`

Format d'erreur :

`{ "error": { "code": "...", "message": "...", "fields": {} } }`

`fields` est facultatif.

Le frontend doit utiliser le code d'erreur et non le texte du message pour identifier le type d'erreur.

## Validation

Toute donnée extérieure est validée à la frontière du système.

Cela concerne notamment le body, les paramètres URL, la query string, les cookies, les webhooks, les fichiers uploadés, les variables d'environnement et les réponses de services externes importantes.

## Erreurs

Catégories minimales :

- VALIDATION_ERROR
- UNAUTHENTICATED
- FORBIDDEN
- NOT_FOUND
- CONFLICT
- RATE_LIMITED
- EXTERNAL_SERVICE_ERROR
- INTERNAL_ERROR

Des codes métier plus précis pourront être ajoutés si nécessaire.

## Base de données

Toute modification PostgreSQL passe par une migration versionnée.

Une migration déjà exécutée n'est jamais modifiée.

Les opérations critiques de réservation, disponibilité et commande utilisent des transactions lorsque nécessaire.

## Règle d'évolution

Avant d'ajouter une fonctionnalité :

1. identifier son module métier
2. définir ses contrats
3. vérifier ses impacts DB
4. vérifier sécurité et permissions
5. placer les règles métier dans le service
6. éviter toute abstraction sans besoin réel

Une nouvelle fonctionnalité ne doit jamais être placée arbitrairement dans une route ou dans un dossier générique.
