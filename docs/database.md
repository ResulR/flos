# Modèle conceptuel de données — Flo's Bikes

## Produits

En V1, une fiche produit représente un vélo physique unique.

Le produit contient au minimum :

- identifiant
- marque
- modèle
- année
- description
- prix
- état
- type de vélo
- statut métier
- activation
- date de création
- date de modification
- date de suppression logique éventuelle

## Statut produit

Valeurs métier prévues :

- `available`
- `reserved`
- `sold`
- `hidden`

`hidden` masque le vélo du catalogue sans le supprimer.

Le soft delete reste séparé du statut métier.

## Référentiels administrables

Les marques, types de vélo et états du vélo sont administrables depuis l'admin.

Ils sont donc stockés séparément du produit.

### Marques

Chaque marque contient au minimum :

- identifiant
- nom
- ordre d'affichage
- activation
- date de création
- date de modification

### Types de vélo

Chaque type contient au minimum :

- identifiant
- nom
- ordre d'affichage
- activation
- date de création
- date de modification

### États du vélo

Chaque état contient au minimum :

- identifiant
- nom
- ordre d'affichage
- activation
- date de création
- date de modification

## Caractéristiques techniques produit

Les caractéristiques techniques sont extensibles sans migration DB.

Chaque caractéristique contient au minimum :

- identifiant
- produit associé
- libellé
- valeur
- ordre d'affichage

Règles :

- les caractéristiques sont propres à chaque produit
- l'admin peut ajouter, modifier, réordonner ou supprimer une caractéristique
- un même libellé ne doit pas être dupliqué pour un même produit
- aucune liste globale de caractéristiques n'est imposée

## Photos produit

Les fichiers image restent hors de PostgreSQL.

La base stocke uniquement les métadonnées nécessaires pour retrouver et ordonner les fichiers.

Chaque photo produit contient au minimum :

- identifiant
- produit associé
- référence ou chemin de fichier
- ordre d'affichage
- date de création

Règles :

- un produit peut avoir plusieurs photos
- l'ordre d'upload définit l'ordre d'affichage
- la première photo dans l'ordre est considérée comme photo principale
- l'ordre doit pouvoir être modifié plus tard sans renommer physiquement les fichiers
- la suppression d'un produit ne doit pas supprimer automatiquement l'historique nécessaire avant décision explicite

## Réservations

Une réservation concerne exactement un vélo.

Chaque réservation contient au minimum :

- identifiant
- produit associé
- coordonnées du client
- date de début
- date d'expiration
- statut
- date de création
- date de modification
- date d'annulation éventuelle
- date de conversion en commande éventuelle

La création d'une réservation et le passage du produit de `available` à `reserved` doivent être atomiques dans une même transaction DB.

Une réservation ne peut être créée que si le produit est encore `available`.

Une seule réservation active peut exister pour un même vélo.

La durée de réservation est choisie entre 1 et 3 jours.

Les réservations expirées, annulées ou converties restent conservées en base pour l'historique et les statistiques.

### Cycle de vie d'une réservation

Statuts prévus :

- `active`
- `cancelled`
- `expired`
- `converted`

À expiration :

- la réservation passe à `expired`
- le vélo redevient `available` uniquement s'il est toujours `reserved`
- un vélo devenu `sold` ou `hidden` ne doit pas être réactivé automatiquement

### Liens sécurisés

Une réservation génère des accès sécurisés permettant :

- d'annuler la réservation
- d'acheter uniquement le vélo réservé

Les secrets utilisés dans les liens ne doivent pas être stockés en clair en base.

La base conserve une empreinte sécurisée permettant de vérifier le lien présenté par le client.

Les accès doivent devenir inutilisables lorsque la réservation est expirée, annulée ou convertie.

## Commandes

Une commande peut contenir plusieurs vélos différents.

Chaque commande contient au minimum :

- identifiant
- coordonnées du client
- mode de remise
- informations de livraison lorsque nécessaires
- statut de commande
- statut de paiement
- sous-total
- frais de livraison
- total
- référence de suivi public sécurisée
- date de création
- date de modification

Une commande possède des lignes de commande séparées.

Chaque ligne conserve au minimum :

- identifiant
- commande associée
- produit associé
- désignation du produit au moment de l'achat
- prix unitaire au moment de l'achat

Les données commerciales nécessaires à l'historique sont conservées dans la commande même si le produit est ensuite modifié.

### Création et attente de paiement

Lorsqu'un checkout classique est créé :

- une commande est créée avec le statut `pending_payment`
- les vélos concernés sont revalidés côté serveur
- tous les vélos doivent encore être `available`
- la création de la commande et le passage des vélos à `reserved` doivent être atomiques dans une même transaction DB
- si un seul vélo n'est plus disponible, l'opération complète échoue

Pendant `pending_payment`, les vélos concernés ne peuvent plus être réservés ou achetés par un autre client.

Si le checkout expire, est abandonné ou si le paiement échoue définitivement :

- la commande quitte l'état d'attente de paiement
- chaque vélo encore `reserved` par cette commande redevient `available`
- un vélo modifié entre-temps en `sold` ou `hidden` ne doit pas être réactivé automatiquement

Après confirmation du paiement, les vélos de la commande passent à `sold`.

### Statuts de commande

Avant paiement :

- `pending_payment`

Après paiement, le cycle dépend du mode de remise.

Pour une livraison :

- `confirmed`
- `preparing`
- `shipped`
- `completed`

Pour un retrait :

- `confirmed`
- `preparing`
- `ready`
- `picked_up`

Une commande payée peut aussi être placée en `cancelled` par l'admin.

L'annulation administrative ne déclenche aucun remboursement Stripe automatique en V1.

## Paiements

Stripe Checkout est utilisé pour les paiements en ligne en V1.

Le paiement reste séparé de la commande afin de conserver son propre cycle de vie et les références du prestataire.

Chaque paiement contient au minimum :

- identifiant
- commande associée
- fournisseur de paiement
- référence Stripe Checkout
- référence Stripe Payment Intent lorsqu'elle existe
- statut
- montant
- devise
- date de création
- date de modification

Le serveur ne considère jamais le retour navigateur depuis Stripe comme preuve suffisante du paiement.

La confirmation définitive du paiement provient d'un webhook Stripe vérifié.

Le traitement des webhooks doit être idempotent afin qu'un même événement reçu plusieurs fois ne produise pas plusieurs changements métier.

Aucun remboursement Stripe automatique n'est réalisé en V1.

### Statuts de paiement

Statuts prévus :

- `pending`
- `paid`
- `failed`
- `expired`

Quand le paiement est confirmé :

- le paiement passe à `paid`
- la commande passe de `pending_payment` à `confirmed`
- les vélos concernés passent à `sold`

Ces changements doivent être appliqués de manière atomique autant que possible.

Quand le checkout expire ou que le paiement échoue définitivement :

- le paiement passe à `expired` ou `failed`
- la commande quitte `pending_payment`
- les vélos encore bloqués par cette commande redeviennent `available`, sauf s'ils ont été modifiés administrativement entre-temps

## Reprises

Une demande de reprise est indépendante des commandes et des réservations.

Chaque demande contient au minimum :

- identifiant
- coordonnées du client
- marque du vélo si connue
- modèle si connu
- année si connue
- description libre
- statut
- date de création
- date de modification

Les informations sur le vélo peuvent rester partielles lorsque le client ne les connaît pas.

Les coordonnées nécessaires pour recontacter le client sont obligatoires.

La réponse commerciale au client se fait hors de l'application en V1, par email ou téléphone.

Seul l'admin modifie le statut d'une demande de reprise.

### Photos de reprise

Une demande de reprise doit contenir au moins une photo.

Les fichiers restent hors de PostgreSQL.
La base stocke uniquement les métadonnées nécessaires.

Chaque photo de reprise contient au minimum :

- identifiant
- demande de reprise associée
- référence ou chemin de fichier
- ordre d'affichage
- date de création

Règles :

- une demande peut contenir plusieurs photos
- au moins une photo est obligatoire
- l'ordre d'upload définit l'ordre d'affichage
- les fichiers doivent rester liés à la demande tant que celle-ci est conservée

## Paramètres du site

Les paramètres métier modifiables depuis l'admin sont stockés en base.

Ils comprennent au minimum :

- téléphone de contact
- email de contact
- adresse
- frais de livraison fixes
- date de modification

Ces valeurs ne doivent pas être codées en dur dans le frontend.

Les frais de livraison sont définis par une valeur unique configurable en V1.

Toute modification de ces paramètres doit être réalisée via l'interface admin et validée côté serveur.
