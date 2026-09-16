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

## Panier sans compte

Le panier public ne nécessite aucun compte client.

En V1 :

- le panier est conservé côté navigateur
- il peut contenir plusieurs vélos différents
- l'ajout au panier ne réserve pas un vélo
- le navigateur ne constitue jamais une source fiable pour le prix ou la disponibilité
- avant tout checkout, le serveur recharge les produits concernés et revalide leur prix et leur disponibilité
- un produit indisponible, réservé, vendu, masqué ou supprimé ne peut pas être acheté depuis le panier

Le panier doit stocker le minimum de données nécessaires, principalement les identifiants produits.

Le checkout déclenché depuis un lien sécurisé de réservation est distinct du panier classique.
Il concerne uniquement le vélo associé à cette réservation et utilise la preuve d'accès sécurisée de la réservation.

## Authentification admin

La V1 utilise un seul compte administrateur.

Principes :

- le mot de passe n'est jamais stocké en clair
- l'authentification est vérifiée côté backend
- la session admin utilise un cookie sécurisé `HttpOnly`
- le cookie est `Secure` en production
- le cookie utilise `SameSite=Lax`
- les routes admin sensibles sont protégées côté serveur
- aucune autorisation sensible ne repose uniquement sur le frontend
- aucun système de rôles complexe n'est introduit en V1
- une session doit pouvoir être révoquée
- la durée de session reste configurable

Les secrets d'authentification sont fournis par l'environnement et ne sont jamais commités dans le dépôt.

## Internationalisation future

La V1 est uniquement en français.

Langues prévues à terme :

- français (`fr`)
- anglais (`en`)
- néerlandais (`nl`)
- espagnol (`es`)
- italien (`it`)
- allemand (`de`)
- albanais (`sq`)

La V1 ne met pas encore en place de routage multilingue complexe.

Principes de préparation :

- éviter de disperser durablement les textes métier dans les composants
- permettre l'extraction progressive des textes vers des ressources de traduction
- utiliser des identifiants de traduction stables lorsque l'internationalisation sera introduite
- utiliser les API `Intl` pour les dates, nombres et montants
- ne pas stocker en base une traduction séparée pour chaque champ tant qu'un besoin métier réel ne l'exige pas
- conserver le français comme langue par défaut en V1

L'architecture doit permettre l'ajout futur d'une couche i18n sans réécriture majeure des fonctionnalités métier.

## Stockage persistant des médias

Les fichiers uploadés ne sont pas stockés dans le dépôt Git.

Le stockage persistant du projet utilise :

`/var/lib/flos-bikes/media`

Organisation prévue :

- `/var/lib/flos-bikes/media/products`
- `/var/lib/flos-bikes/media/trade-ins`

Principes :

- les fichiers survivent aux déploiements du code
- PostgreSQL stocke uniquement les métadonnées et références nécessaires
- le backend contrôle les écritures et suppressions
- les chemins internes du serveur ne doivent pas être exposés directement au client
- les déploiements ne doivent jamais nettoyer automatiquement ce répertoire
- le dossier appartient au compte de service utilisé par l'application
