import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Clock3 } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/reservation/$productId')({
  component: ReservationPage,
})

function ReservationPage() {
  return (
    <PublicPage>
      <section className="site-container py-10 lg:py-14">
        <a
          href="/catalogue"
          className="type-secondary inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour au vélo
        </a>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="type-label uppercase tracking-[0.16em] text-primary">
              Réservation gratuite
            </p>

            <h1 className="type-display mt-3">Garder ce vélo de côté.</h1>

            <p className="type-body mt-5 max-w-2xl text-muted-foreground">
              Une réservation rend immédiatement le vélo indisponible à l’achat
              et aux autres réservations pendant la durée choisie.
            </p>

            <form className="mt-10 space-y-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Prénom" name="firstName" />
                <Field label="Nom" name="lastName" />
                <Field label="Email" name="email" type="email" />
                <Field label="Téléphone" name="phone" type="tel" />
              </div>

              <fieldset className="border-t border-border pt-8">
                <legend className="type-heading-3">Durée</legend>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map((day) => (
                    <label
                      key={day}
                      className="surface-card cursor-pointer p-4 text-center"
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={day}
                        className="mb-3 accent-brand-red"
                      />
                      <span className="block font-medium">
                        {day} {day === 1 ? 'jour' : 'jours'}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-lg bg-brand-gray-50 p-5">
                <div className="flex gap-3">
                  <Clock3
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                  />
                  <div>
                    <p className="font-medium">Expiration calculée</p>
                    <p className="type-secondary mt-1 text-muted-foreground">
                      La date et l’heure exactes seront calculées par le serveur
                      à partir de la durée sélectionnée.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="type-button inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-7 text-primary-foreground hover:bg-brand-red-dark"
              >
                Confirmer la réservation gratuite
              </button>
            </form>
          </div>

          <aside className="surface-card h-fit p-6">
            <div className="aspect-[4/3] rounded-lg bg-brand-gray-100" />

            <p className="type-secondary mt-5 uppercase tracking-[0.08em] text-muted-foreground">
              Marque
            </p>
            <h2 className="type-product-title mt-1">Modèle du vélo</h2>
            <p className="type-price mt-4">Prix</p>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-sm font-medium text-primary">Disponible</p>
            </div>
          </aside>
        </div>
      </section>
    </PublicPage>
  )
}

function Field({
  label,
  name,
  type = 'text',
}: {
  label: string
  name: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="type-label mb-2 block">{label}</span>
      <input name={name} type={type} className="form-control w-full" />
    </label>
  )
}
