import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, LockKeyhole } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  return (
    <PublicPage>
      <section className="border-b border-border bg-brand-gray-50">
        <div className="site-container py-10 lg:py-14">
          <a
            href="/panier"
            className="type-secondary inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour au panier
          </a>

          <p className="type-label mt-8 uppercase tracking-[0.16em] text-primary">
            Commande
          </p>

          <h1 className="type-display mt-3">Finaliser votre achat.</h1>

          <p className="type-body mt-4 max-w-2xl text-muted-foreground">
            Aucun compte n’est nécessaire. Les informations saisies servent
            uniquement au traitement de votre commande.
          </p>
        </div>
      </section>

      <section className="site-container section-space">
        <div className="grid gap-10 lg:grid-cols-[1fr_23rem]">
          <form className="space-y-10">
            <fieldset>
              <legend className="type-heading-3">Vos coordonnées</legend>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextField label="Prénom" name="firstName" />
                <TextField label="Nom" name="lastName" />
                <TextField label="Email" name="email" type="email" />
                <TextField label="Téléphone" name="phone" type="tel" />
              </div>
            </fieldset>

            <fieldset className="border-t border-border pt-10">
              <legend className="type-heading-3">Mode de réception</legend>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Choice
                  name="deliveryMethod"
                  value="pickup"
                  title="Retrait"
                  description="Récupérer la commande directement auprès de Flo’s Bikes."
                />

                <Choice
                  name="deliveryMethod"
                  value="delivery"
                  title="Livraison"
                  description="Faire livrer la commande à l’adresse indiquée."
                />
              </div>
            </fieldset>

            <fieldset className="border-t border-border pt-10">
              <legend className="type-heading-3">Adresse de livraison</legend>

              <p className="type-secondary mt-3 text-muted-foreground">
                Cette section sera affichée uniquement lorsque la livraison est
                sélectionnée.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField label="Adresse" name="address" />
                </div>
                <TextField label="Code postal" name="postalCode" />
                <TextField label="Ville" name="city" />
                <div className="sm:col-span-2">
                  <TextField label="Pays" name="country" />
                </div>
              </div>
            </fieldset>

            <div className="border-t border-border pt-10">
              <div className="flex gap-3 rounded-lg bg-brand-gray-50 p-5">
                <LockKeyhole
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />

                <div>
                  <p className="font-medium">Paiement sécurisé avec Stripe</p>
                  <p className="type-secondary mt-1 text-muted-foreground">
                    Après validation, vous serez redirigé vers Stripe Checkout
                    pour effectuer le paiement.
                  </p>
                </div>
              </div>
            </div>
          </form>

          <aside className="surface-card h-fit p-6 lg:sticky lg:top-6">
            <h2 className="text-xl font-medium">Votre commande</h2>

            <div className="mt-6 border-b border-border pb-5">
              <div className="flex gap-4">
                <div className="size-20 shrink-0 rounded-md bg-brand-gray-100" />

                <div>
                  <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                    Marque
                  </p>
                  <p className="font-medium">Modèle du vélo</p>
                  <p className="type-secondary mt-2 text-muted-foreground">
                    Quantité : 1
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-4">
              <SummaryRow label="Sous-total" value="Prix" />
              <SummaryRow label="Livraison" value="À calculer" />

              <div className="border-t border-border pt-4">
                <SummaryRow label="Total" value="Montant serveur" strong />
              </div>
            </dl>

            <Button type="button" size="lg" className="mt-6 w-full">
              Continuer vers Stripe
              <ExternalLink aria-hidden="true" className="size-4" />
            </Button>

            <p className="type-secondary mt-4 text-muted-foreground">
              Le montant final sera recalculé côté serveur avant la création de
              la session Stripe Checkout.
            </p>
          </aside>
        </div>
      </section>
    </PublicPage>
  )
}

function Choice({
  name,
  value,
  title,
  description,
}: {
  name: string
  value: string
  title: string
  description: string
}) {
  return (
    <label className="surface-card flex cursor-pointer gap-3 p-5">
      <input
        type="radio"
        name={name}
        value={value}
        className="mt-1 accent-brand-red"
      />

      <span>
        <span className="block font-medium">{title}</span>
        <span className="type-secondary mt-1 block text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  )
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt
        className={
          strong ? 'font-medium' : 'type-secondary text-muted-foreground'
        }
      >
        {label}
      </dt>
      <dd className={strong ? 'text-xl font-medium' : 'font-medium'}>
        {value}
      </dd>
    </div>
  )
}
