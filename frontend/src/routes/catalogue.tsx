import { createFileRoute } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'

import { ProductCard } from '@/components/catalogue/product-card'
import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/catalogue')({
  component: CataloguePage,
})

const previewProducts = [
  {
    brand: 'Marque',
    model: 'Modèle du vélo',
    priceLabel: 'Prix',
    condition: 'Très bon état',
    status: 'available' as const,
  },
  {
    brand: 'Marque',
    model: 'Modèle du vélo',
    priceLabel: 'Prix',
    condition: 'Bon état',
    status: 'reserved' as const,
    reservedUntil: '18/09',
  },
  {
    brand: 'Marque',
    model: 'Modèle du vélo',
    priceLabel: 'Prix',
    condition: 'Très bon état',
    status: 'available' as const,
  },
  {
    brand: 'Marque',
    model: 'Modèle du vélo',
    priceLabel: 'Prix',
    condition: 'Bon état',
    status: 'available' as const,
  },
  {
    brand: 'Marque',
    model: 'Modèle du vélo',
    priceLabel: 'Prix',
    condition: 'Très bon état',
    status: 'sold' as const,
  },
  {
    brand: 'Marque',
    model: 'Modèle du vélo',
    priceLabel: 'Prix',
    condition: 'Bon état',
    status: 'available' as const,
  },
]

function CataloguePage() {
  return (
    <PublicPage>
      <section className="border-b border-border bg-brand-gray-50">
        <div className="site-container py-12 lg:py-16">
          <p className="type-label uppercase tracking-[0.16em] text-primary">
            Catalogue
          </p>

          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="type-display">Trouver votre prochain vélo.</h1>

              <p className="type-body mt-4 max-w-2xl text-muted-foreground">
                Recherchez et filtrez les vélos disponibles sans perdre de vue
                les informations essentielles.
              </p>
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <span className="sr-only">
                Rechercher une marque ou un modèle
              </span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                placeholder="Marque ou modèle"
                className="form-control w-full pl-11 pr-4"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="site-container section-space">
        <div className="mb-6 lg:hidden">
          <details className="surface-card">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-medium">
              Filtres
              <SlidersHorizontal aria-hidden="true" className="size-4" />
            </summary>

            <div className="border-t border-border p-4">
              <Filters />
            </div>
          </details>
        </div>

        <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="type-label mb-5 uppercase tracking-[0.12em]">
                Filtres
              </p>
              <Filters />
            </div>
          </aside>

          <div>
            <div className="mb-7 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="type-secondary text-muted-foreground">
                Résultats du catalogue
              </p>

              <label className="flex items-center gap-3">
                <span className="type-secondary text-muted-foreground">
                  Trier par
                </span>
                <select className="form-control min-h-10">
                  <option>Plus récents</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                </select>
              </label>
            </div>

            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {previewProducts.map((product, index) => (
                <ProductCard
                  key={index}
                  href={`/produits/exemple-${index + 1}`}
                  brand={product.brand}
                  model={product.model}
                  priceLabel={product.priceLabel}
                  condition={product.condition}
                  status={product.status}
                  reservedUntil={product.reservedUntil}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function Filters() {
  return (
    <div className="space-y-6">
      <FilterSelect label="Marque" options={['Toutes les marques']} />
      <FilterSelect label="Type" options={['Tous les types']} />
      <FilterSelect label="État" options={['Tous les états']} />
      <FilterSelect label="Année" options={['Toutes les années']} />
      <FilterSelect
        label="Disponibilité"
        options={['Tous', 'Disponible', 'Réservé']}
      />

      <fieldset>
        <legend className="type-label mb-3">Prix</legend>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min."
            aria-label="Prix minimum"
            className="form-control w-full"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max."
            aria-label="Prix maximum"
            className="form-control w-full"
          />
        </div>
      </fieldset>
    </div>
  )
}

function FilterSelect({
  label,
  options,
}: {
  label: string
  options: string[]
}) {
  return (
    <label className="block">
      <span className="type-label mb-2 block">{label}</span>

      <select className="form-control w-full">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
