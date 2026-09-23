import { createFileRoute } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ProductCard } from '@/components/catalogue/product-card'
import { Button } from '@/components/ui/button'
import { FlowState } from '@/components/feedback/flow-state'
import { PublicPage } from '@/components/layout/public-page'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/catalogue')({
  component: CataloguePage,
})

type CatalogueProduct = {
  id: string
  brand: string
  model: string
  priceCents: string
  condition: string
  status: 'available' | 'reserved' | 'sold'
  reservedUntil: string | null
  imageUrl: string | null
}

type FilterOption = {
  id: string
  name: string
}

type CatalogueFilterOptions = {
  brands: FilterOption[]
  bikeTypes: FilterOption[]
  conditions: FilterOption[]
  years: number[]
}

function formatPrice(priceCents: string) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(priceCents) / 100)
}

function formatReservationExpiration(value: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function CataloguePage() {
  const [products, setProducts] = useState<CatalogueProduct[]>([])
  const [filterOptions, setFilterOptions] = useState<CatalogueFilterOptions>({
    brands: [],
    bikeTypes: [],
    conditions: [],
    years: [],
  })
  const [brandId, setBrandId] = useState('')
  const [bikeTypeId, setBikeTypeId] = useState('')
  const [conditionId, setConditionId] = useState('')
  const [year, setYear] = useState('')
  const [availability, setAvailability] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<'recent' | 'price_asc' | 'price_desc'>(
    'recent',
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasActiveFilters = Boolean(
    brandId ||
    bikeTypeId ||
    conditionId ||
    year ||
    availability ||
    minPrice ||
    maxPrice,
  )

  function resetFilters() {
    setBrandId('')
    setBikeTypeId('')
    setConditionId('')
    setYear('')
    setAvailability('')
    setMinPrice('')
    setMaxPrice('')
  }

  useEffect(() => {
    let cancelled = false

    async function loadFilterOptions() {
      try {
        const options =
          await apiRequest<CatalogueFilterOptions>('/products/filters')

        if (!cancelled) {
          setFilterOptions(options)
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger les filtres du catalogue.')
        }
      }
    }

    void loadFilterOptions()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [search])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (brandId) params.set('brandId', brandId)
      if (bikeTypeId) params.set('bikeTypeId', bikeTypeId)
      if (conditionId) params.set('conditionId', conditionId)
      if (year) params.set('year', year)
      if (availability) params.set('availability', availability)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('sort', sort)

      if (minPrice) {
        params.set('minPriceCents', String(Math.round(Number(minPrice) * 100)))
      }

      if (maxPrice) {
        params.set('maxPriceCents', String(Math.round(Number(maxPrice) * 100)))
      }

      const query = params.toString()
      const path = query ? `/products?${query}` : '/products'

      try {
        const data = await apiRequest<CatalogueProduct[]>(path)

        if (!cancelled) {
          setProducts(data)
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger le catalogue pour le moment.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [
    brandId,
    bikeTypeId,
    conditionId,
    year,
    availability,
    minPrice,
    maxPrice,
    debouncedSearch,
    sort,
  ])

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
                maxLength={100}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
              <Filters
                options={filterOptions}
                brandId={brandId}
                bikeTypeId={bikeTypeId}
                conditionId={conditionId}
                year={year}
                availability={availability}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onBrandChange={setBrandId}
                onBikeTypeChange={setBikeTypeId}
                onConditionChange={setConditionId}
                onYearChange={setYear}
                onAvailabilityChange={setAvailability}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                hasActiveFilters={hasActiveFilters}
                onReset={resetFilters}
              />
            </div>
          </details>
        </div>

        <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="type-label mb-5 uppercase tracking-[0.12em]">
                Filtres
              </p>
              <Filters
                options={filterOptions}
                brandId={brandId}
                bikeTypeId={bikeTypeId}
                conditionId={conditionId}
                year={year}
                availability={availability}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onBrandChange={setBrandId}
                onBikeTypeChange={setBikeTypeId}
                onConditionChange={setConditionId}
                onYearChange={setYear}
                onAvailabilityChange={setAvailability}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                hasActiveFilters={hasActiveFilters}
                onReset={resetFilters}
              />
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
                <select
                  className="form-control min-h-10"
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value as
                        'recent' | 'price_asc' | 'price_desc',
                    )
                  }
                >
                  <option value="recent">Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </label>
            </div>

            {isLoading ? (
              <FlowState
                kind="loading"
                title="Chargement du catalogue"
                description="Les vélos disponibles sont en cours de chargement."
              />
            ) : error ? (
              <FlowState
                kind="error"
                title="Catalogue indisponible"
                description={error}
              />
            ) : products.length === 0 ? (
              <FlowState
                kind="empty"
                title={
                  debouncedSearch
                    ? 'Aucun résultat pour cette recherche'
                    : hasActiveFilters
                      ? 'Aucun résultat pour ces filtres'
                      : 'Aucun vélo pour le moment'
                }
                description={
                  debouncedSearch || hasActiveFilters
                    ? 'Aucun vélo ne correspond actuellement aux critères sélectionnés.'
                    : 'Le catalogue ne contient actuellement aucun vélo à afficher.'
                }
              />
            ) : (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    href={`/produits/${product.id}`}
                    imageSrc={product.imageUrl}
                    brand={product.brand}
                    model={product.model}
                    priceLabel={formatPrice(product.priceCents)}
                    condition={product.condition}
                    status={product.status}
                    reservedUntil={
                      product.reservedUntil
                        ? formatReservationExpiration(product.reservedUntil)
                        : null
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function Filters({
  options,
  brandId,
  bikeTypeId,
  conditionId,
  year,
  availability,
  minPrice,
  maxPrice,
  onBrandChange,
  onBikeTypeChange,
  onConditionChange,
  onYearChange,
  onAvailabilityChange,
  onMinPriceChange,
  onMaxPriceChange,
  hasActiveFilters,
  onReset,
}: {
  options: CatalogueFilterOptions
  brandId: string
  bikeTypeId: string
  conditionId: string
  year: string
  availability: string
  minPrice: string
  maxPrice: string
  onBrandChange: (value: string) => void
  onBikeTypeChange: (value: string) => void
  onConditionChange: (value: string) => void
  onYearChange: (value: string) => void
  onAvailabilityChange: (value: string) => void
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  hasActiveFilters: boolean
  onReset: () => void
}) {
  return (
    <div className="space-y-6">
      <FilterSelect
        label="Marque"
        value={brandId}
        onChange={onBrandChange}
        emptyLabel="Toutes les marques"
        options={options.brands}
      />

      <FilterSelect
        label="Type"
        value={bikeTypeId}
        onChange={onBikeTypeChange}
        emptyLabel="Tous les types"
        options={options.bikeTypes}
      />

      <FilterSelect
        label="État"
        value={conditionId}
        onChange={onConditionChange}
        emptyLabel="Tous les états"
        options={options.conditions}
      />

      <FilterSelect
        label="Année"
        value={year}
        onChange={onYearChange}
        emptyLabel="Toutes les années"
        options={options.years.map((item) => ({
          id: String(item),
          name: String(item),
        }))}
      />

      <FilterSelect
        label="Disponibilité"
        value={availability}
        onChange={onAvailabilityChange}
        emptyLabel="Tous"
        options={[
          { id: 'available', name: 'Disponible' },
          { id: 'reserved', name: 'Réservé' },
          { id: 'sold', name: 'Vendu' },
        ]}
      />

      <fieldset>
        <legend className="type-label mb-3">Prix</legend>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min."
            aria-label="Prix minimum"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            className="form-control w-full"
          />
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max."
            aria-label="Prix maximum"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            className="form-control w-full"
          />
        </div>
      </fieldset>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onReset}
        >
          Réinitialiser les filtres
        </Button>
      ) : null}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  emptyLabel,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  emptyLabel: string
  options: FilterOption[]
}) {
  return (
    <label className="block">
      <span className="type-label mb-2 block">{label}</span>

      <select
        className="form-control w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  )
}
