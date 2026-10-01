import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'

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
        <ProductSkeleton />
      </PublicPage>
    )
  }

  if (error || !product) {
    return (
      <PublicPage>
        <section className="site-container py-16 sm:py-20 lg:py-24">
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

  const isInCart =
    isHydrated && items.some((item) => item.productId === product.id)

  return (
    <PublicPage>
      <div className="bg-[#f7f5f1]">
        <div className="site-container py-5 sm:py-6">
          <a
            href="/catalogue"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#171717]"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
            />
            Retour au catalogue
          </a>
        </div>
      </div>

      <section className="bg-[#f7f5f1] pb-16 sm:pb-20 lg:pb-28">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:gap-16 xl:gap-20">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/5">
                <div className="aspect-[4/3]">
                  {selectedMedia ? (
                    <img
                      src={buildApiUrl(selectedMedia.imageUrl)}
                      alt={`${product.brand} ${product.model}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                      Aucune photo disponible
                    </div>
                  )}
                </div>
              </div>

              {product.media.length > 1 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {product.media.map((media, index) => {
                    const isSelected = media.id === selectedMedia?.id

                    return (
                      <button
                        key={media.id}
                        type="button"
                        aria-label={`Afficher la photo ${index + 1}`}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedMediaId(media.id)}
                        className={[
                          'aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-white transition-all sm:w-28',
                          isSelected
                            ? 'ring-2 ring-[#171717] ring-offset-2 ring-offset-[#f7f5f1]'
                            : 'opacity-70 ring-1 ring-black/10 hover:opacity-100',
                        ].join(' ')}
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

            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="rounded-[1.75rem] bg-white p-6 ring-1 ring-black/5 sm:p-8 lg:p-9">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                      {product.brand}
                    </p>

                    <h1 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-[clamp(2.8rem,5vw,4.8rem)] font-normal leading-[0.94] tracking-[-0.05em] text-[#171717]">
                      {product.model}
                    </h1>
                  </div>

                  {product.status !== 'available' ? (
                    <StatusBadge status={product.status} />
                  ) : null}
                </div>

                <p className="mt-7 text-[2rem] font-medium tracking-[-0.035em] text-[#171717]">
                  {formatPrice(product.priceCents)}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  <ProductAttribute>{product.condition}</ProductAttribute>

                  {product.year !== null ? (
                    <ProductAttribute>{product.year}</ProductAttribute>
                  ) : null}

                  <ProductAttribute>{product.bikeType}</ProductAttribute>
                </div>

                <div className="mt-8 border-t border-black/10 pt-7">
                  <Availability product={product} />
                </div>

                {product.status === 'available' ? (
                  <div className="mt-8">
                    <div className="grid gap-3">
                      {isInCart ? (
                        <>
                          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-100">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <Check aria-hidden="true" className="size-4" />
                            </span>

                            <p className="text-sm font-medium text-emerald-900">
                              Ce vélo est dans votre panier
                            </p>
                          </div>

                          <a
                            href="/panier"
                            className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#171717] px-7 text-sm font-medium text-white transition-all hover:bg-black/80"
                          >
                            <ShoppingBag
                              aria-hidden="true"
                              className="size-4"
                            />
                            Voir le panier
                            <ArrowRight
                              aria-hidden="true"
                              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                            />
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={!isHydrated}
                          onClick={() => {
                            addItem(product.id)
                            setCartFeedback('Ce vélo a été ajouté au panier.')
                          }}
                          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#b44a42] px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#9d4039] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShoppingBag aria-hidden="true" className="size-4" />
                          Ajouter au panier
                        </button>
                      )}

                      <a
                        href={`/reservation/${product.id}`}
                        className="inline-flex min-h-13 items-center justify-center rounded-full border border-black/15 px-7 text-sm font-medium text-[#171717] transition-colors hover:border-black/30 hover:bg-[#f7f5f1]"
                      >
                        Réserver gratuitement
                      </a>
                    </div>

                    {cartFeedback && !isInCart ? (
                      <p
                        role="status"
                        aria-live="polite"
                        className="mt-3 text-sm text-[#b44a42]"
                      >
                        {cartFeedback}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-8 space-y-5 border-t border-black/10 pt-7">
                  <ReassuranceItem
                    icon={<ShieldCheck aria-hidden="true" className="size-5" />}
                    title="Informations présentées clairement"
                    text="État et caractéristiques visibles avant votre décision."
                  />

                  <ReassuranceItem
                    icon={<Clock3 aria-hidden="true" className="size-5" />}
                    title="Réservation temporaire"
                    text="Vous pouvez réserver ce vélo jusqu’à trois jours."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-28">
        <div className="site-container">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-24">
            <section>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                Le vélo
              </p>

              <h2 className="mt-4 max-w-lg font-[Georgia,'Times_New_Roman',serif] text-[clamp(2.5rem,4.5vw,4rem)] font-normal leading-[0.98] tracking-[-0.045em] text-[#171717]">
                À propos de ce vélo.
              </h2>

              <p className="mt-7 max-w-xl whitespace-pre-line text-base font-light leading-[1.75] text-muted-foreground">
                {product.description}
              </p>
            </section>

            <section>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                    Détails
                  </p>

                  <h2 className="mt-4 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717] sm:text-4xl">
                    Caractéristiques
                  </h2>
                </div>
              </div>

              <dl className="mt-8 border-t border-black/10">
                {[
                  ['Marque', product.brand],
                  ['Modèle', product.model],
                  ['Année', product.year !== null ? String(product.year) : '—'],
                  ['Type', product.bikeType],
                  ['État', product.condition],
                ].map(([label, value]) => (
                  <SpecRow key={label} label={label} value={value} />
                ))}

                {product.specs.map((spec) => (
                  <SpecRow
                    key={spec.id}
                    label={spec.label}
                    value={spec.value}
                  />
                ))}
              </dl>
            </section>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function ProductAttribute({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f7f5f1] px-3.5 py-2 text-sm font-medium text-[#414141]">
      {children}
    </span>
  )
}

function StatusBadge({
  status,
}: {
  status: 'available' | 'reserved' | 'sold'
}) {
  return (
    <span className="shrink-0 rounded-full bg-[#171717] px-3 py-2 text-xs font-medium text-white">
      {status === 'reserved'
        ? 'Réservé'
        : status === 'sold'
          ? 'Vendu'
          : 'Disponible'}
    </span>
  )
}

function Availability({ product }: { product: ProductDetail }) {
  if (product.status === 'available') {
    return (
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#b44a42]/10 text-[#b44a42]">
          <Check aria-hidden="true" className="size-4" />
        </span>

        <div>
          <p className="text-sm font-medium text-[#171717]">Disponible</p>
          <p className="mt-1 text-sm font-light leading-relaxed text-muted-foreground">
            Ce vélo peut être acheté maintenant ou réservé gratuitement.
          </p>
        </div>
      </div>
    )
  }

  if (product.status === 'reserved') {
    return (
      <div className="flex gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#171717]">
          <Clock3 aria-hidden="true" className="size-4" />
        </span>

        <div>
          <p className="text-sm font-medium text-[#171717]">
            Actuellement réservé
          </p>
          <p className="mt-1 text-sm font-light leading-relaxed text-muted-foreground">
            {product.reservedUntil
              ? `Réservé jusqu’au ${formatReservationExpiration(product.reservedUntil)}.`
              : 'Ce vélo est actuellement réservé.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-[#171717]">Vendu</p>
      <p className="mt-1 text-sm font-light leading-relaxed text-muted-foreground">
        Ce vélo n’est plus disponible à l’achat ou à la réservation.
      </p>
    </div>
  )
}

function ReassuranceItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-[#b44a42]">{icon}</div>

      <div>
        <p className="text-sm font-medium text-[#171717]">{title}</p>
        <p className="mt-1 text-sm font-light leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,0.7fr)_minmax(0,1.3fr)] gap-6 border-b border-black/10 py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-[#171717]">{value}</dd>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="bg-[#f7f5f1]">
      <div className="site-container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          <div className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-black/5" />

          <div className="rounded-[1.75rem] bg-white p-8 ring-1 ring-black/5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-black/5" />
            <div className="mt-5 h-14 w-3/4 animate-pulse rounded-xl bg-black/5" />
            <div className="mt-8 h-9 w-32 animate-pulse rounded-xl bg-black/5" />

            <div className="mt-8 flex gap-2">
              <div className="h-9 w-24 animate-pulse rounded-full bg-black/5" />
              <div className="h-9 w-20 animate-pulse rounded-full bg-black/5" />
              <div className="h-9 w-24 animate-pulse rounded-full bg-black/5" />
            </div>

            <div className="mt-9 h-px bg-black/5" />
            <div className="mt-7 h-16 animate-pulse rounded-xl bg-black/5" />
            <div className="mt-8 h-14 animate-pulse rounded-full bg-black/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
