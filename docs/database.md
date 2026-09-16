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
