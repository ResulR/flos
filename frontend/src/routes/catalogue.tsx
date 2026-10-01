import { createFileRoute } from '@tanstack/react-router'
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ProductCard } from '@/components/catalogue/product-card'
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

type ActiveFilter = {
  key: string
  label: string
  clear: () => void
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

function getOptionLabel(options: FilterOption[], value: string) {
  return options.find((option) => option.id === value)?.name ?? value
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

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
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

  const activeFilterCount = [
    brandId,
    bikeTypeId,
    conditionId,
    year,
    availability,
    minPrice,
    maxPrice,
  ].filter(Boolean).length

  const activeFilters: ActiveFilter[] = []

  if (brandId) {
    activeFilters.push({
      key: 'brand',
      label: getOptionLabel(filterOptions.brands, brandId),
      clear: () => setBrandId(''),
    })
  }

  if (bikeTypeId) {
    activeFilters.push({
      key: 'type',
      label: getOptionLabel(filterOptions.bikeTypes, bikeTypeId),
      clear: () => setBikeTypeId(''),
    })
  }

  if (conditionId) {
    activeFilters.push({
      key: 'condition',
      label: getOptionLabel(filterOptions.conditions, conditionId),
      clear: () => setConditionId(''),
    })
  }

  if (year) {
    activeFilters.push({
      key: 'year',
      label: year,
      clear: () => setYear(''),
    })
  }

  if (availability) {
    const labels: Record<string, string> = {
      available: 'Disponible',
      reserved: 'Réservé',
      sold: 'Vendu',
    }

    activeFilters.push({
      key: 'availability',
      label: labels[availability] ?? availability,
      clear: () => setAvailability(''),
    })
  }

  if (minPrice) {
    activeFilters.push({
      key: 'min-price',
      label: `Dès ${minPrice} €`,
      clear: () => setMinPrice(''),
    })
  }

  if (maxPrice) {
    activeFilters.push({
      key: 'max-price',
      label: `Jusqu’à ${maxPrice} €`,
      clear: () => setMaxPrice(''),
    })
  }

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
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-14 sm:py-16 lg:py-20">
          <p className="type-label uppercase tracking-[0.2em] text-[#b44a42]">
            Catalogue
          </p>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
            <h1 className="max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.2rem,6.2vw,6.1rem)] font-normal leading-[0.94] tracking-[-0.055em] text-[#171717]">
              Chaque vélo a déjà
              <span className="block italic text-[#b44a42]">une histoire.</span>
            </h1>

            <div className="pb-1">
              <p className="max-w-md text-base font-light leading-relaxed text-muted-foreground">
                Parcourez la sélection, comparez les vélos et trouvez celui qui
                continuera la route avec vous.
              </p>

              <p className="mt-5 text-sm font-medium text-[#171717]">
                {isLoading
                  ? 'Chargement de la sélection…'
                  : `${products.length} ${
                      products.length > 1
                        ? 'vélos disponibles'
                        : 'vélo disponible'
                    }`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="site-container py-10 sm:py-12 lg:py-16">
          <div className="rounded-[1.5rem] border border-black/8 bg-[#f7f5f1] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-2 lg:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">
                  Rechercher une marque ou un modèle
                </span>

                <Search
                  aria-hidden="true"
                  className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                />

                <input
                  type="search"
                  placeholder="Rechercher une marque ou un modèle"
                  maxLength={100}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-h-14 w-full rounded-[1.1rem] border-0 bg-white pl-13 pr-5 text-sm outline-none ring-1 ring-black/5 transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-[#b44a42]/25"
                />
              </label>

              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[1.1rem] bg-white px-5 text-sm font-medium text-[#171717] ring-1 ring-black/5 transition-all hover:ring-black/15"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Filtres
                {activeFilterCount > 0 ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#b44a42] text-xs text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  className="flex min-h-14 min-w-[12.75rem] items-center justify-between gap-4 rounded-[1.1rem] bg-white px-4 ring-1 ring-black/5 transition-all hover:ring-black/15 focus:outline-none focus:ring-2 focus:ring-[#b44a42]/20"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Trier
                    </span>

                    <span className="text-sm font-medium text-[#171717]">
                      {sort === 'recent'
                        ? 'Plus récents'
                        : sort === 'price_asc'
                          ? 'Prix croissant'
                          : 'Prix décroissant'}
                    </span>
                  </span>

                  <ChevronDown
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className={[
                      'size-4 shrink-0 text-[#171717] transition-transform duration-200',
                      sortOpen ? 'rotate-180' : '',
                    ].join(' ')}
                  />
                </button>

                {sortOpen ? (
                  <div
                    role="listbox"
                    aria-label="Trier les vélos"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-full min-w-[12.75rem] overflow-hidden rounded-[1rem] border border-black/10 bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]"
                  >
                    {[
                      { value: 'recent', label: 'Plus récents' },
                      { value: 'price_asc', label: 'Prix croissant' },
                      { value: 'price_desc', label: 'Prix décroissant' },
                    ].map((option) => {
                      const selected = sort === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setSort(
                              option.value as
                                'recent' | 'price_asc' | 'price_desc',
                            )
                            setSortOpen(false)
                          }}
                          className={[
                            'flex min-h-11 w-full items-center justify-between gap-4 rounded-xl px-3.5 text-left text-sm transition-colors',
                            selected
                              ? 'bg-[#f7f5f1] font-medium text-[#171717]'
                              : 'text-[#414141] hover:bg-[#f7f5f1]',
                          ].join(' ')}
                        >
                          <span>{option.label}</span>

                          {selected ? (
                            <Check
                              aria-hidden="true"
                              className="size-4 text-[#b44a42]"
                              strokeWidth={2}
                            />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {filtersOpen ? (
            <div className="mt-4 rounded-[1.5rem] border border-black/8 bg-[#f7f5f1] p-5 sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#171717]">
                    Affiner la sélection
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Combinez plusieurs critères si nécessaire.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Fermer les filtres"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-black/5 transition-colors hover:bg-black/5"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>

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
          ) : null}

          {activeFilters.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={filter.clear}
                  className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 text-xs font-medium text-[#171717] transition-colors hover:border-[#b44a42]/30 hover:text-[#b44a42]"
                >
                  {filter.label}

                  <X
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground transition-colors group-hover:text-[#b44a42]"
                  />
                </button>
              ))}

              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-[#171717]"
              >
                Tout effacer
              </button>
            </div>
          ) : null}

          <div className="mt-10 flex items-end justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-sm font-medium text-[#171717]">
                {isLoading
                  ? 'Sélection en cours…'
                  : `${products.length} ${
                      products.length > 1 ? 'résultats' : 'résultat'
                    }`}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Vélos correspondant à votre recherche
              </p>
            </div>

            {debouncedSearch ? (
              <p className="hidden text-xs text-muted-foreground sm:block">
                Recherche : “{debouncedSearch}”
              </p>
            ) : null}
          </div>

          <div className="mt-8">
            {isLoading ? (
              <CatalogueSkeleton />
            ) : error ? (
              <FlowState
                kind="error"
                title="Catalogue indisponible"
                description={error}
              />
            ) : products.length === 0 ? (
              <div className="rounded-[1.5rem] border border-black/8 bg-[#f7f5f1] px-6 py-14 text-center sm:px-10 sm:py-20">
                <p className="font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717] sm:text-4xl">
                  Aucun vélo ne correspond.
                </p>

                <p className="mx-auto mt-4 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
                  Essayez une autre recherche ou retirez certains filtres pour
                  élargir la sélection.
                </p>

                {debouncedSearch || hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      resetFilters()
                    }}
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#171717] px-6 text-sm font-medium text-white transition-colors hover:bg-black/80"
                  >
                    Réinitialiser la recherche
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8 xl:gap-y-16">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    href={`/produits/${product.id}`}
                    variant="catalogue"
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
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
        emptyLabel="Toutes"
        options={[
          { id: 'available', name: 'Disponible' },
          { id: 'reserved', name: 'Réservé' },
          { id: 'sold', name: 'Vendu' },
        ]}
      />

      <fieldset>
        <legend className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Prix
        </legend>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min."
            aria-label="Prix minimum"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition-colors focus:border-[#b44a42]/50"
          />

          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max."
            aria-label="Prix maximum"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition-colors focus:border-[#b44a42]/50"
          />
        </div>
      </fieldset>

      {hasActiveFilters ? (
        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-[#171717] transition-colors hover:border-[#b44a42]/25 hover:text-[#b44a42]"
          >
            Réinitialiser
          </button>
        </div>
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
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>

      <select
        className="min-h-12 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition-colors focus:border-[#b44a42]/50"
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

function CatalogueSkeleton() {
  return (
    <div
      className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <div className="aspect-[4/3] animate-pulse rounded-[1.5rem] bg-black/5" />

          <div className="mt-5">
            <div className="h-3 w-20 animate-pulse rounded-full bg-black/5" />
            <div className="mt-3 h-6 w-40 animate-pulse rounded-full bg-black/5" />
            <div className="mt-5 h-px bg-black/5" />

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-black/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
