import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  ShoppingBag,
  Trash2,
} from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'
import { useCart } from '@/features/cart/cart-context'
import { apiRequest, buildApiUrl } from '@/lib/api'

export const Route = createFileRoute('/panier')({
  component: CartPage,
})

type CartProduct = {
  id: string
  brand: string
  model: string
  priceCents: string
  status: 'available' | 'reserved' | 'sold'
  media: Array<{
    id: string
    imageUrl: string
  }>
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(priceCents / 100)
}

function CartPage() {
  const { items, isHydrated, removeItem } = useCart()

  const [products, setProducts] = useState<Record<string, CartProduct | null>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isHydrated || items.length === 0) {
      return
    }

    let cancelled = false

    async function loadProducts() {
      setIsLoading(true)

      const entries = await Promise.all(
        items.map(async (item) => {
          try {
            const product = await apiRequest<CartProduct>(
              `/products/${item.productId}`,
            )

            return [item.productId, product] as const
          } catch {
            return [item.productId, null] as const
          }
        }),
      )

      if (!cancelled) {
        setProducts(Object.fromEntries(entries))
        setIsLoading(false)
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [isHydrated, items])

  const totalCents = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = products[item.productId]

        if (!product) {
          return total
        }

        const priceCents = Number(product.priceCents)

        return Number.isFinite(priceCents) ? total + priceCents : total
      }, 0),
    [items, products],
  )

  const unavailableCount = items.filter((item) => {
    const product = products[item.productId]

    return product && product.status !== 'available'
  }).length

  return (
    <PublicPage>
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-14 sm:py-16 lg:py-20">
          <a
            href="/catalogue"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#171717]"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
            />
            Continuer mes achats
          </a>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
                Panier
              </p>

              <h1 className="mt-4 max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.2rem,6vw,5.8rem)] font-normal leading-[0.94] tracking-[-0.055em] text-[#171717]">
                Votre sélection.
              </h1>
            </div>

            <div className="lg:pb-1">
              <p className="max-w-md text-base font-light leading-relaxed text-muted-foreground">
                Un vélo ajouté au panier n’est pas encore réservé. Sa
                disponibilité et son prix seront vérifiés avant la commande.
              </p>

              {isHydrated && !isLoading && items.length > 0 ? (
                <p className="mt-5 text-sm font-medium text-[#171717]">
                  {items.length} {items.length > 1 ? 'vélos' : 'vélo'} dans
                  votre panier
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          {!isHydrated || isLoading ? (
            <CartSkeleton />
          ) : items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem]">
              <div>
                <div className="flex items-end justify-between border-b border-black/10 pb-5">
                  <div>
                    <p className="text-sm font-medium text-[#171717]">
                      Vos vélos
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chaque vélo est une pièce unique.
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {items.length} {items.length > 1 ? 'articles' : 'article'}
                  </span>
                </div>

                <div className="divide-y divide-black/10">
                  {items.map((item) => {
                    const product = products[item.productId]

                    if (!product) {
                      return (
                        <UnavailableProduct
                          key={item.productId}
                          onRemove={() => removeItem(item.productId)}
                        />
                      )
                    }

                    return (
                      <CartProductRow
                        key={item.productId}
                        product={product}
                        onRemove={() => removeItem(item.productId)}
                      />
                    )
                  })}
                </div>
              </div>

              <aside className="h-fit lg:sticky lg:top-8">
                <div className="rounded-[1.75rem] bg-[#f7f5f1] p-6 ring-1 ring-black/5 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                    Récapitulatif
                  </p>

                  <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
                    Votre commande
                  </h2>

                  <div className="mt-7 space-y-4">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {items.length > 1 ? 'Vélos' : 'Vélo'}
                      </span>
                      <span className="font-medium text-[#171717]">
                        {formatPrice(totalCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Livraison</span>
                      <span className="text-right text-muted-foreground">
                        Calculée à l’étape suivante
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-black/10 pt-6">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#171717]">
                          Total indicatif
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Hors éventuels frais de livraison
                        </p>
                      </div>

                      <p className="text-2xl font-medium tracking-[-0.03em] text-[#171717]">
                        {formatPrice(totalCents)}
                      </p>
                    </div>
                  </div>

                  {unavailableCount > 0 ? (
                    <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-100">
                      <div className="flex gap-3">
                        <Clock3
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-amber-700"
                        />

                        <p className="text-sm leading-relaxed text-amber-900">
                          {unavailableCount > 1
                            ? 'Certains vélos ne sont plus disponibles actuellement.'
                            : 'Un vélo n’est plus disponible actuellement.'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <a
                    href="/checkout"
                    className="group mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#b44a42] px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#9d4039]"
                  >
                    Continuer la commande
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </a>

                  <div className="mt-6 border-t border-black/10 pt-5">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
                        <Check aria-hidden="true" className="size-3.5" />
                      </span>

                      <p className="text-xs font-light leading-relaxed text-muted-foreground">
                        Prix et disponibilité seront revérifiés avant la
                        validation de votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="/catalogue"
                  className="group mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#171717]"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
                  />
                  Retour au catalogue
                </a>
              </aside>
            </div>
          )}
        </div>
      </section>
    </PublicPage>
  )
}

function CartProductRow({
  product,
  onRemove,
}: {
  product: CartProduct
  onRemove: () => void
}) {
  const imageUrl = product.media[0]?.imageUrl ?? null

  return (
    <article className="grid gap-5 py-7 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-7 lg:grid-cols-[12rem_minmax(0,1fr)_auto]">
      <a
        href={`/produits/${product.id}`}
        className="block overflow-hidden rounded-[1.25rem] bg-[#f7f5f1] ring-1 ring-black/5"
      >
        <div className="aspect-[4/3]">
          {imageUrl ? (
            <img
              src={buildApiUrl(imageUrl)}
              alt={`${product.brand} ${product.model}`}
              className="size-full object-cover transition-transform duration-500 hover:scale-[1.035]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Photo indisponible
            </div>
          )}
        </div>
      </a>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {product.brand}
        </p>

        <a
          href={`/produits/${product.id}`}
          className="mt-1 inline-block text-xl font-medium tracking-[-0.025em] text-[#171717] transition-colors hover:text-[#b44a42]"
        >
          {product.model}
        </a>

        <div className="mt-4">
          <ProductStatus status={product.status} />
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-[#b44a42]"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Retirer du panier
        </button>
      </div>

      <div className="flex items-center justify-between gap-6 sm:block sm:self-start sm:text-right">
        <p className="text-xl font-medium tracking-[-0.025em] text-[#171717]">
          {formatPrice(Number(product.priceCents))}
        </p>

        <p className="mt-1 text-xs text-muted-foreground sm:mt-2">
          Pièce unique
        </p>
      </div>
    </article>
  )
}

function ProductStatus({ status }: { status: CartProduct['status'] }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-50">
          <Check aria-hidden="true" className="size-3" />
        </span>
        Disponible
      </span>
    )
  }

  if (status === 'reserved') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
        <Clock3 aria-hidden="true" className="size-4" />
        Actuellement réservé
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
      Vendu
    </span>
  )
}

function UnavailableProduct({ onRemove }: { onRemove: () => void }) {
  return (
    <article className="py-7">
      <div className="rounded-[1.25rem] bg-[#f7f5f1] p-5 ring-1 ring-black/5 sm:p-6">
        <p className="text-sm font-medium text-[#171717]">Vélo indisponible</p>

        <p className="mt-2 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
          Ce vélo n’est plus accessible dans le catalogue. Vous pouvez le
          retirer du panier.
        </p>

        <button
          type="button"
          onClick={onRemove}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#b44a42] transition-colors hover:text-[#9d4039]"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Retirer du panier
        </button>
      </div>
    </article>
  )
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] bg-[#f7f5f1] px-6 py-16 text-center ring-1 ring-black/5 sm:px-12 sm:py-20">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#b44a42] shadow-sm ring-1 ring-black/5">
        <ShoppingBag aria-hidden="true" className="size-6" />
      </span>

      <h2 className="mt-7 font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717] sm:text-5xl">
        Votre panier est vide.
      </h2>

      <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
        Parcourez notre sélection et ajoutez le vélo qui vous correspond.
      </p>

      <a
        href="/catalogue"
        className="group mt-8 inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#b44a42] px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#9d4039]"
      >
        Découvrir les vélos
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
        />
      </a>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div
      className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16"
      aria-hidden="true"
    >
      <div>
        <div className="h-12 border-b border-black/10" />

        <div className="space-y-0 divide-y divide-black/10">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-5 py-7 sm:grid-cols-[11rem_1fr_auto]"
            >
              <div className="aspect-[4/3] animate-pulse rounded-[1.25rem] bg-black/5" />

              <div>
                <div className="h-3 w-20 animate-pulse rounded-full bg-black/5" />
                <div className="mt-3 h-6 w-40 animate-pulse rounded-full bg-black/5" />
                <div className="mt-5 h-5 w-28 animate-pulse rounded-full bg-black/5" />
              </div>

              <div className="h-6 w-24 animate-pulse rounded-full bg-black/5" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-[25rem] animate-pulse rounded-[1.75rem] bg-black/5" />
    </div>
  )
}
