import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { FlowState } from '@/components/feedback/flow-state'
import { PublicPage } from '@/components/layout/public-page'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/commande/$trackingToken')({
  component: OrderTrackingPage,
})

type OrderStatus =
  | 'pending_payment'
  | 'payment_failed'
  | 'payment_expired'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'ready'
  | 'picked_up'
  | 'cancelled'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

type PublicOrderTracking = {
  id: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  fulfillmentMethod: 'delivery' | 'pickup'
  totalCents: string
  currency: 'EUR'
  items: Array<{
    productName: string
    unitPriceCents: string
  }>
}

const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: 'En attente de paiement',
  payment_failed: 'Paiement échoué',
  payment_expired: 'Paiement expiré',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  completed: 'Terminée',
  ready: 'Prête au retrait',
  picked_up: 'Retirée',
  cancelled: 'Annulée',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  expired: 'Expiré',
}

function formatPrice(priceCents: string) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(priceCents) / 100)
}

function OrderTrackingPage() {
  const { trackingToken } = Route.useParams()

  const [order, setOrder] = useState<PublicOrderTracking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInvalid, setIsInvalid] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      setIsLoading(true)
      setIsInvalid(false)

      try {
        const data = await apiRequest<PublicOrderTracking>(
          `/orders/tracking/${encodeURIComponent(trackingToken)}`,
        )

        if (!cancelled) {
          setOrder(data)
        }
      } catch {
        if (!cancelled) {
          setOrder(null)
          setIsInvalid(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      cancelled = true
    }
  }, [trackingToken])

  if (isLoading) {
    return (
      <PublicPage>
        <section className="site-container section-space">
          <FlowState
            kind="loading"
            title="Chargement de la commande"
            description="Les informations de suivi sont en cours de chargement."
          />
        </section>
      </PublicPage>
    )
  }

  if (isInvalid || !order) {
    return (
      <PublicPage>
        <section className="site-container section-space">
          <FlowState
            kind="error"
            title="Lien de suivi indisponible"
            description="Ce lien de suivi n’est pas valide ou n’est plus disponible."
          />
        </section>
      </PublicPage>
    )
  }

  const orderStatus = orderStatusLabels[order.status]
  const paymentStatus = paymentStatusLabels[order.paymentStatus]
  const fulfillmentMethod =
    order.fulfillmentMethod === 'pickup' ? 'Retrait' : 'Livraison'

  return (
    <PublicPage>
      <section className="site-container section-space">
        <div className="mx-auto max-w-4xl">
          <p className="type-label uppercase tracking-[0.16em] text-primary">
            Suivi de commande
          </p>

          <h1 className="type-display mt-3">Commande #{order.id}</h1>

          <p className="type-body mt-4 text-muted-foreground">
            Retrouvez ici uniquement les informations nécessaires au suivi de
            votre commande.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <StatusCard label="Paiement" value={paymentStatus} />
            <StatusCard label="Réception" value={fulfillmentMethod} />
            <StatusCard label="Traitement" value={orderStatus} />
          </div>

          <section className="mt-10 surface-card p-6">
            <h2 className="type-heading-3">Produits</h2>

            <div className="mt-6 divide-y divide-border">
              {order.items.map((item, index) => (
                <div
                  key={`${item.productName}-${index}`}
                  className="flex items-start justify-between gap-5 py-5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="type-product-title">{item.productName}</p>
                    <p className="type-secondary mt-2 text-muted-foreground">
                      Quantité : 1
                    </p>
                  </div>

                  <p className="shrink-0 font-medium">
                    {formatPrice(item.unitPriceCents)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-6">
              <span className="font-medium">Montant total</span>
              <span className="type-price">
                {formatPrice(order.totalCents)}
              </span>
            </div>
          </section>

          <section className="mt-10 border-l-2 border-primary pl-6">
            <div className="flex items-start gap-3">
              <PackageCheck
                aria-hidden="true"
                className="mt-1 size-6 shrink-0 text-primary"
              />

              <div>
                <h2 className="type-heading-3">{orderStatus}</h2>
                <p className="type-body mt-3 text-muted-foreground">
                  Le statut affiché ici correspond à l’état actuel de votre
                  commande.
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
                  page. Conservez ce lien de suivi privé.
                </p>
              </div>
            </div>
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
