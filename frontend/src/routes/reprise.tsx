import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/reprise')({
  component: TradeInPage,
})

function TradeInPage() {
  return (
    <PublicPage>
      <section className="overflow-hidden bg-brand-red text-brand-white">
        <div className="site-container py-14 lg:py-20">
          <p className="type-label uppercase tracking-[0.16em] text-brand-white/70">
            Reprise
          </p>

          <h1 className="type-display mt-3 max-w-3xl">
            Vous avez un vélo à vendre ?
          </h1>

          <p className="type-body mt-5 max-w-2xl text-brand-white/80">
            Envoyez ce que vous connaissez. La marque, le modèle ou l’année
            peuvent être laissés vides si vous ne les connaissez pas.
          </p>
        </div>
      </section>

      <section className="site-container section-space">
        <form className="mx-auto max-w-4xl">
          <section>
            <h2 className="type-heading-3">Vos coordonnées</h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Prénom" name="firstName" required />
              <Field label="Nom" name="lastName" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Téléphone" name="phone" type="tel" required />
            </div>
          </section>

          <section className="mt-10 border-t border-border pt-10">
            <h2 className="type-heading-3">Le vélo</h2>

            <p className="type-secondary mt-3 text-muted-foreground">
              Ces informations sont facultatives.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Marque — facultatif" name="brand" />
              <Field label="Modèle — facultatif" name="model" />
              <Field label="Année — facultatif" name="year" />
              <Field label="Prix souhaité — facultatif" name="desiredPrice" />
            </div>

            <label className="mt-5 block">
              <span className="type-label mb-2 block">
                Description — facultatif
              </span>
              <textarea
                name="description"
                rows={5}
                className="form-control w-full py-3"
              />
            </label>
          </section>

          <section className="mt-10 border-t border-border pt-10">
            <h2 className="type-heading-3">Photos</h2>

            <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-brand-gray-400 bg-brand-gray-50 p-8 text-center">
              <ImagePlus
                aria-hidden="true"
                className="size-7 text-primary"
              />

              <span className="mt-4 font-medium">
                Ajouter plusieurs photos
              </span>

              <span className="type-secondary mt-2 max-w-md text-muted-foreground">
                Les formats et limites définitifs seront appliqués par la
                validation serveur.
              </span>

              <input type="file" multiple className="sr-only" />
            </label>
          </section>

          <button
            type="button"
            className="type-button mt-10 inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-7 text-primary-foreground hover:bg-brand-red-dark"
          >
            Envoyer ma demande
          </button>
        </form>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 border-t border-border pt-10 sm:grid-cols-2">
          <div>
            <p className="font-medium">Demande envoyée</p>
            <p className="type-secondary mt-2 text-muted-foreground">
              Un état de confirmation remplacera le formulaire après une
              soumission réussie.
            </p>
          </div>

          <div>
            <p className="font-medium">Erreur de soumission</p>
            <p className="type-secondary mt-2 text-muted-foreground">
              Les erreurs resteront associées aux champs concernés sans effacer
              les informations déjà saisies.
            </p>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="type-label mb-2 block">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="form-control w-full"
      />
    </label>
  )
}
