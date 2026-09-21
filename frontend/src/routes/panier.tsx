import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Trash2 } from 'lucide-react'

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

  return (
    <PublicPage>
      <section className="border-b border-border bg-brand-gray-50">
        <div className="site-container py-12 lg:py-16">
          <p className="type-label uppercase tracking-[0.16em] text-primary">
            Panier
          </p>

          <h1 className="type-display mt-3">Votre sélection.</h1>

          <p className="type-body mt-4 max-w-2xl text-muted-foreground">
            Ajouter un vélo au panier ne le réserve pas. Sa disponibilité sera
            vérifiée avant la commande.
          </p>
        </div>
      </section>

      <section className="site-container section-space">
        {!isHydrated || isLoading ? (
          <p className="type-body text-muted-foreground">
            Chargement du panier…
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border bg-brand-gray-50 p-6">
            <h2 className="text-xl font-medium">Votre panier est vide.</h2>

            <p className="type-secondary mt-2 text-muted-foreground">
              Ajoutez un vélo depuis le catalogue pour le retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-6">
              {items.map((item) => {
                const product = products[item.productId]

                if (!product) {
                  return (
                    <article
                      key={item.productId}
                      className="border-b border-border pb-6"
                    >
                      <p className="font-medium">Vélo indisponible</p>

                      <p className="type-secondary mt-2 text-muted-foreground">
                        Ce vélo n’est plus accessible dans le catalogue.
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        Supprimer
                      </button>
                    </article>
                  )
                }

                const imageUrl = product.media[0]?.imageUrl ?? null

                return (
                  <article
                    key={item.productId}
                    className="grid gap-5 border-b border-border pb-6 sm:grid-cols-[10rem_1fr_auto]"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-brand-gray-100">
                      {imageUrl ? (
                        <img
                          src={buildApiUrl(imageUrl)}
                          alt={`${product.brand} ${product.model}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                          Photo indisponible
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                        {product.brand}
                      </p>

                      <h2 className="type-product-title mt-1">
                        {product.model}
                      </h2>

                      <p className="type-secondary mt-3 text-muted-foreground">
                        Quantité : {item.quantity}
                      </p>

                      <p
                        className={`mt-2 text-sm font-medium ${
                          product.status === 'available'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {product.status === 'available'
                          ? 'Disponible'
                          : product.status === 'reserved'
                            ? 'Réservé'
                            : 'Vendu'}
                      </p>
                    </div>

                    <div className="flex items-start justify-between gap-6 sm:flex-col sm:items-end">
                      <p className="text-xl font-medium">
                        {formatPrice(Number(product.priceCents))}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        Supprimer
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="surface-card h-fit p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-medium">Récapitulatif</h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between gap-4">
                  <span className="type-secondary text-muted-foreground">
                    Sous-total
                  </span>

                  <span className="font-medium">{formatPrice(totalCents)}</span>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium">Total indicatif</span>

                    <span className="text-xl font-medium">
                      {formatPrice(totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href="/checkout"
                className="type-button mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-primary-foreground transition-colors hover:bg-brand-red-dark"
              >
                Continuer
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>

              <p className="type-secondary mt-4 text-muted-foreground">
                Le panier ne constitue pas une réservation.
              </p>
            </aside>
          </div>
        )}
      </section>
    </PublicPage>
  )
}
