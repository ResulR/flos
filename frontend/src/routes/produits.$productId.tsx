import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Check, Clock3, ShieldCheck } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/produits/$productId')({
  component: ProductPage,
})

function ProductPage() {
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
              <div className="flex size-full items-center justify-center text-muted-foreground">
                Photo principale
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Afficher la photo ${item}`}
                  className="aspect-[4/3] rounded-md border border-border bg-brand-gray-50"
                />
              ))}
            </div>
          </div>

          <div className="lg:pt-4">
            <p className="type-label uppercase tracking-[0.12em] text-primary">
              Marque
            </p>

            <h1 className="type-display mt-2">Modèle du vélo</h1>

            <p className="type-price mt-6">Prix</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-md bg-brand-gray-100 px-3 py-2 text-sm font-medium">
                Très bon état
              </span>
              <span className="rounded-md bg-brand-gray-100 px-3 py-2 text-sm font-medium">
                Année
              </span>
              <span className="rounded-md bg-brand-gray-100 px-3 py-2 text-sm font-medium">
                Type
              </span>
            </div>

            <div className="mt-8 border-y border-border py-6">
              <div className="flex items-center gap-3 text-sm font-medium">
                <Check aria-hidden="true" className="size-5 text-primary" />
                Disponible
              </div>

              <p className="type-secondary mt-2 text-muted-foreground">
                Ce vélo peut être acheté ou réservé gratuitement.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href="/panier"
                className="type-button inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 text-primary-foreground transition-colors hover:bg-brand-red-dark"
              >
                Ajouter au panier
              </a>

              <a
                href="/reservation/exemple"
                className="type-button inline-flex min-h-12 items-center justify-center rounded-md border border-brand-black px-6 text-brand-black transition-colors hover:bg-brand-gray-50"
              >
                Réserver
              </a>
            </div>

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

            <p className="type-body mt-5 text-muted-foreground">
              La description réelle du vélo sera affichée ici depuis les données
              administrées dans le catalogue.
            </p>
          </section>

          <section>
            <p className="type-label uppercase tracking-[0.12em] text-primary">
              Fiche technique
            </p>

            <h2 className="type-heading-3 mt-3">Caractéristiques</h2>

            <dl className="mt-5 divide-y divide-border border-y border-border">
              {['Marque', 'Modèle', 'Année', 'Type', 'État'].map((label) => (
                <div key={label} className="grid grid-cols-2 gap-4 py-4">
                  <dt className="type-secondary text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-right font-medium">À renseigner</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </section>
    </PublicPage>
  )
}
