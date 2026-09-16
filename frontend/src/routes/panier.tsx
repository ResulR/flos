import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Trash2 } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/panier')({
  component: CartPage,
})

function CartPage() {
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
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <article className="grid gap-5 border-b border-border pb-6 sm:grid-cols-[10rem_1fr_auto]">
              <div className="aspect-[4/3] rounded-lg bg-brand-gray-100">
                <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                  Photo
                </div>
              </div>

              <div>
                <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                  Marque
                </p>

                <h2 className="type-product-title mt-1">Modèle du vélo</h2>

                <p className="type-secondary mt-3 text-muted-foreground">
                  Quantité : 1
                </p>

                <p className="mt-2 text-sm font-medium text-primary">
                  Disponible
                </p>
              </div>

              <div className="flex items-start justify-between gap-6 sm:flex-col sm:items-end">
                <p className="text-xl font-medium">Prix</p>

                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Supprimer
                </button>
              </div>
            </article>

            <aside className="mt-8 rounded-lg border border-border bg-brand-gray-50 p-5">
              <p className="font-medium">Article devenu indisponible</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Si un vélo est vendu ou réservé avant la validation, il sera
                clairement signalé ici et ne pourra pas être commandé.
              </p>
            </aside>
          </div>

          <aside className="surface-card h-fit p-6 lg:sticky lg:top-6">
            <h2 className="text-xl font-medium">Récapitulatif</h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="type-secondary text-muted-foreground">
                  Sous-total
                </span>
                <span className="font-medium">Prix</span>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">Total indicatif</span>
                  <span className="text-xl font-medium">Prix</span>
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
      </section>
    </PublicPage>
  )
}
