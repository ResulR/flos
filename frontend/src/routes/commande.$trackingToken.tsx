import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, PackageCheck } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/commande/$trackingToken')({
  component: OrderTrackingPage,
})

function OrderTrackingPage() {
  return (
    <PublicPage>
      <section className="site-container section-space">
        <div className="mx-auto max-w-4xl">
          <p className="type-label uppercase tracking-[0.16em] text-primary">
            Suivi de commande
          </p>

          <h1 className="type-display mt-3">Commande #XXXX</h1>

          <p className="type-body mt-4 text-muted-foreground">
            Cette page présente uniquement les informations nécessaires au
            suivi de votre commande.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <StatusCard label="Paiement" value="Payé" />
            <StatusCard label="Réception" value="Retrait / livraison" />
            <StatusCard label="Traitement" value="En préparation" />
          </div>

          <section className="mt-10 surface-card p-6">
            <h2 className="type-heading-3">Produits</h2>

            <div className="mt-6 flex gap-5 border-b border-border pb-6">
              <div className="size-24 shrink-0 rounded-lg bg-brand-gray-100" />

              <div>
                <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                  Marque
                </p>
                <p className="type-product-title mt-1">Modèle du vélo</p>
                <p className="mt-3 font-medium">Prix</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="font-medium">Montant total</span>
              <span className="type-price">Montant</span>
            </div>
          </section>

          <section className="mt-10 border-l-2 border-primary pl-6">
            <div className="flex items-start gap-3">
              <PackageCheck
                aria-hidden="true"
                className="mt-1 size-6 shrink-0 text-primary"
              />

              <div>
                <h2 className="type-heading-3">En préparation</h2>
                <p className="type-body mt-3 text-muted-foreground">
                  Le statut réel de traitement sera affiché ici à partir des
                  données de la commande.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-14 rounded-xl bg-brand-gray-50 p-6">
            <div className="flex gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="font-medium">Lien sécurisé</p>
                <p className="type-secondary mt-1 text-muted-foreground">
                  Aucun compte client n’est nécessaire pour consulter cette
                  page.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10 border-t border-border pt-10">
            <p className="type-label uppercase tracking-[0.12em] text-muted-foreground">
              État alternatif
            </p>
            <h2 className="type-heading-3 mt-3">Lien invalide ou expiré.</h2>
            <p className="type-body mt-3 text-muted-foreground">
              Aucune information de commande ne doit être révélée lorsqu’un
              lien de suivi n’est pas valide.
            </p>
          </section>
        </div>
      </section>
    </PublicPage>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="type-secondary text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  )
}
