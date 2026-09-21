import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Clock3, ShieldCheck } from 'lucide-react'

import { FlowState } from '@/components/feedback/flow-state'
import { PublicPage } from '@/components/layout/public-page'
import { useCart } from '@/features/cart/cart-context'
import { apiRequest, buildApiUrl } from '@/lib/api'

export const Route = createFileRoute('/produits/$productId')({
  component: ProductPage,
})

function formatPrice(priceCents: string) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(priceCents) / 100)
}

type ProductDetail = {
  id: string
  brand: string
  model: string
  bikeType: string
  condition: string
  year: number | null
  description: string
  priceCents: string
  status: 'available' | 'reserved' | 'sold'
  reservedUntil: string | null
  specs: Array<{
    id: string
    label: string
    value: string
  }>
  media: Array<{
    id: string
    imageUrl: string
  }>
}

function formatReservationExpiration(value: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function ProductPage() {
  const { productId } = Route.useParams()
  const { items, isHydrated, addItem } = useCart()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [cartFeedback, setCartFeedback] = useState<string | null>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await apiRequest<ProductDetail>(`/products/${productId}`)

        if (!cancelled) {
          setProduct(data)
          setSelectedMediaId(data.media[0]?.id ?? null)
        }
      } catch {
        if (!cancelled) {
          setProduct(null)
          setError('Impossible de charger ce vélo.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProduct()

    return () => {
      cancelled = true
    }
  }, [productId])

  if (isLoading) {
    return (
      <PublicPage>
        <section className="site-container section-space">
          <FlowState
            kind="loading"
            title="Chargement du vélo"
            description="Les informations du vélo sont en cours de chargement."
          />
        </section>
      </PublicPage>
    )
  }

  if (error || !product) {
    return (
      <PublicPage>
        <section className="site-container section-space">
          <FlowState
            kind="error"
            title="Vélo indisponible"
            description={error ?? 'Ce vélo est introuvable.'}
          />
        </section>
      </PublicPage>
    )
  }

  const selectedMedia =
    product.media.find((item) => item.id === selectedMediaId) ??
    product.media[0] ??
    null

  return (
    <PublicPage>
      <section className="site-container py-6">
        <a
          href="/catalogue"
          className="type-secondary inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour au catalogue
        </a>
      </section>

      <section className="site-container pb-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-brand-gray-100">
              {selectedMedia ? (
                <img
                  src={buildApiUrl(selectedMedia.imageUrl)}
                  alt={`${product.brand} ${product.model}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  Aucune photo disponible
                </div>
              )}
            </div>

            {product.media.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {product.media.map((media, index) => {
                  const isSelected = media.id === selectedMedia?.id

                  return (
                    <button
                      key={media.id}
                      type="button"
                      aria-label={`Afficher la photo ${index + 1}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMediaId(media.id)}
                      className={`aspect-[4/3] overflow-hidden rounded-md border bg-brand-gray-50 ${
                        isSelected
                          ? 'border-brand-black'
                          : 'border-border hover:border-brand-black'
                      }`}
                    >
                      <img
                        src={buildApiUrl(media.imageUrl)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="lg:pt-4">
            <p className="type-label uppercase tracking-[0.12em] text-primary">
              {product.brand}
            </p>

            <h1 className="type-display mt-2">{product.model}</h1>

            <p className="type-price mt-6">{formatPrice(product.priceCents)}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-md bg-brand-gray-100 px-3 py-2 text-sm font-medium">
                {product.condition}
              </span>

              {product.year !== null ? (
                <span className="rounded-md bg-brand-gray-100 px-3 py-2 text-sm font-medium">
                  {product.year}
                </span>
              ) : null}

              <span className="rounded-md bg-brand-gray-100 px-3 py-2 text-sm font-medium">
                {product.bikeType}
              </span>
            </div>

            <div className="mt-8 border-y border-border py-6">
              {product.status === 'available' ? (
                <>
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Check aria-hidden="true" className="size-5 text-primary" />
                    Disponible
                  </div>

                  <p className="type-secondary mt-2 text-muted-foreground">
                    Ce vélo peut être acheté ou réservé gratuitement.
                  </p>
                </>
              ) : product.status === 'reserved' ? (
                <>
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Clock3
                      aria-hidden="true"
                      className="size-5 text-primary"
                    />
                    Réservé
                  </div>

                  <p className="type-secondary mt-2 text-muted-foreground">
                    {product.reservedUntil
                      ? `Réservé jusqu’au ${formatReservationExpiration(product.reservedUntil)}.`
                      : 'Ce vélo est actuellement réservé.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-sm font-medium">
                    Vendu
                  </div>

                  <p className="type-secondary mt-2 text-muted-foreground">
                    Ce vélo n’est plus disponible à l’achat ou à la réservation.
                  </p>
                </>
              )}
            </div>

            {product.status === 'available' ? (
              <div className="mt-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={
                      !isHydrated ||
                      items.some((item) => item.productId === product.id)
                    }
                    onClick={() => {
                      addItem(product.id)
                      setCartFeedback('Ce vélo a été ajouté au panier.')
                    }}
                    className="type-button inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 text-primary-foreground transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {items.some((item) => item.productId === product.id)
                      ? 'Dans le panier'
                      : 'Ajouter au panier'}
                  </button>

                  <a
                    href={`/reservation/${product.id}`}
                    className="type-button inline-flex min-h-12 items-center justify-center rounded-md border border-brand-black px-6 text-brand-black transition-colors hover:bg-brand-gray-50"
                  >
                    Réserver
                  </a>
                </div>

                {cartFeedback ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className="type-secondary mt-3 text-primary"
                  >
                    {cartFeedback}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div className="flex gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="font-medium">Informations claires</p>
                  <p className="type-secondary mt-1 text-muted-foreground">
                    État et caractéristiques présentés avant achat.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock3
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="font-medium">Réservation temporaire</p>
                  <p className="type-secondary mt-1 text-muted-foreground">
                    Jusqu’à trois jours selon votre choix.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-12 border-t border-border pt-12 lg:grid-cols-2">
          <section>
            <p className="type-label uppercase tracking-[0.12em] text-primary">
              Description
            </p>

            <h2 className="type-heading-3 mt-3">À propos de ce vélo</h2>

            <p className="type-body mt-5 whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          </section>

          <section>
            <p className="type-label uppercase tracking-[0.12em] text-primary">
              Fiche technique
            </p>

            <h2 className="type-heading-3 mt-3">Caractéristiques</h2>

            <dl className="mt-5 divide-y divide-border border-y border-border">
              {[
                ['Marque', product.brand],
                ['Modèle', product.model],
                ['Année', product.year !== null ? String(product.year) : '—'],
                ['Type', product.bikeType],
                ['État', product.condition],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-4 py-4">
                  <dt className="type-secondary text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}

              {product.specs.map((spec) => (
                <div key={spec.id} className="grid grid-cols-2 gap-4 py-4">
                  <dt className="type-secondary text-muted-foreground">
                    {spec.label}
                  </dt>
                  <dd className="text-right font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </section>
    </PublicPage>
  )
}
