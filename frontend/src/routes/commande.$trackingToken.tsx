import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  Check,
  Clock3,
  CreditCard,
  LockKeyhole,
  PackageCheck,
  Store,
  Truck,
} from 'lucide-react'
import { useEffect, useState } from 'react'

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
  confirmed: 'Commande confirmée',
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
        <TrackingSkeleton />
      </PublicPage>
    )
  }

  if (isInvalid || !order) {
    return (
      <PublicPage>
        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <div className="site-container">
            <div className="mx-auto max-w-2xl rounded-[2rem] bg-red-50 px-6 py-14 text-center ring-1 ring-red-100 sm:px-10">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-red-700 ring-1 ring-red-100">
                <AlertCircle aria-hidden="true" className="size-6" />
              </span>

              <h1 className="mt-7 font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717]">
                Lien de suivi indisponible
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
                Ce lien de suivi n’est pas valide ou n’est plus disponible.
              </p>
            </div>
          </div>
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
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
            Suivi de commande
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.2rem,6vw,5.5rem)] font-normal leading-[0.94] tracking-[-0.055em] text-[#171717]">
                Commande #{order.id}
              </h1>

              <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
                Retrouvez ici l’état actuel de votre commande et les
                informations nécessaires à son suivi.
              </p>
            </div>

            <StatusPill status={order.status} label={orderStatus} />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <div className="mx-auto max-w-5xl">
            <section className="rounded-[2rem] bg-[#171717] px-6 py-7 text-white sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <PackageCheck aria-hidden="true" className="size-5" />
                  </span>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">
                      Statut actuel
                    </p>

                    <h2 className="mt-2 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] sm:text-4xl">
                      {orderStatus}
                    </h2>
                  </div>
                </div>

                <p className="max-w-sm text-sm font-light leading-relaxed text-white/60">
                  Cette page reflète le dernier état enregistré pour votre
                  commande.
                </p>
              </div>
            </section>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoCard
                icon={<CreditCard aria-hidden="true" className="size-5" />}
                label="Paiement"
                value={paymentStatus}
                tone={paymentTone(order.paymentStatus)}
              />

              <InfoCard
                icon={
                  order.fulfillmentMethod === 'pickup' ? (
                    <Store aria-hidden="true" className="size-5" />
                  ) : (
                    <Truck aria-hidden="true" className="size-5" />
                  )
                }
                label="Réception"
                value={fulfillmentMethod}
              />

              <InfoCard
                icon={<PackageCheck aria-hidden="true" className="size-5" />}
                label="Traitement"
                value={orderStatus}
                tone={orderTone(order.status)}
              />
            </div>

            <section className="mt-10 rounded-[2rem] bg-[#f7f5f1] p-6 ring-1 ring-black/5 sm:p-8">
              <div className="flex items-end justify-between gap-6 border-b border-black/10 pb-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                    Commande
                  </p>

                  <h2 className="mt-2 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
                    Vos vélos
                  </h2>
                </div>

                <span className="text-xs text-muted-foreground">
                  {order.items.length}{' '}
                  {order.items.length > 1 ? 'articles' : 'article'}
                </span>
              </div>

              <div className="divide-y divide-black/10">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.productName}-${index}`}
                    className="flex items-start justify-between gap-6 py-6"
                  >
                    <div>
                      <p className="text-lg font-medium tracking-[-0.02em] text-[#171717]">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Pièce unique
                      </p>
                    </div>

                    <p className="shrink-0 text-lg font-medium tracking-[-0.02em] text-[#171717]">
                      {formatPrice(item.unitPriceCents)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-end justify-between gap-6 border-t border-black/10 pt-6">
                <div>
                  <p className="text-sm font-medium text-[#171717]">
                    Montant total
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Montant enregistré pour cette commande
                  </p>
                </div>

                <p className="text-3xl font-medium tracking-[-0.035em] text-[#171717]">
                  {formatPrice(order.totalCents)}
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-[1.5rem] bg-[#f7f5f1] p-5 ring-1 ring-black/5 sm:p-6">
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
                  <LockKeyhole aria-hidden="true" className="size-4" />
                </span>

                <div>
                  <p className="text-sm font-medium text-[#171717]">
                    Lien de suivi privé
                  </p>

                  <p className="mt-1.5 max-w-2xl text-sm font-light leading-relaxed text-muted-foreground">
                    Aucun compte client n’est nécessaire pour consulter cette
                    page. Conservez ce lien privé pour pouvoir retrouver votre
                    commande.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function StatusPill({ status, label }: { status: OrderStatus; label: string }) {
  const tone = orderTone(status)

  return (
    <span
      className={[
        'inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1',
        tone === 'success'
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
          : tone === 'warning'
            ? 'bg-amber-50 text-amber-800 ring-amber-100'
            : tone === 'error'
              ? 'bg-red-50 text-red-800 ring-red-100'
              : 'bg-white text-[#171717] ring-black/10',
      ].join(' ')}
    >
      {tone === 'success' ? (
        <Check aria-hidden="true" className="size-4" />
      ) : tone === 'warning' ? (
        <Clock3 aria-hidden="true" className="size-4" />
      ) : null}

      {label}
    </span>
  )
}

function InfoCard({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning' | 'error'
}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/10 sm:p-6">
      <div className="flex items-start gap-4">
        <span
          className={[
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            tone === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : tone === 'warning'
                ? 'bg-amber-50 text-amber-700'
                : tone === 'error'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-[#f7f5f1] text-[#b44a42]',
          ].join(' ')}
        >
          {icon}
        </span>

        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-sm font-medium text-[#171717]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function paymentTone(status: PaymentStatus): 'success' | 'warning' | 'error' {
  if (status === 'paid') {
    return 'success'
  }

  if (status === 'pending') {
    return 'warning'
  }

  return 'error'
}

function orderTone(
  status: OrderStatus,
): 'default' | 'success' | 'warning' | 'error' {
  if (
    status === 'confirmed' ||
    status === 'preparing' ||
    status === 'shipped' ||
    status === 'completed' ||
    status === 'ready' ||
    status === 'picked_up'
  ) {
    return 'success'
  }

  if (status === 'pending_payment') {
    return 'warning'
  }

  if (
    status === 'payment_failed' ||
    status === 'payment_expired' ||
    status === 'cancelled'
  ) {
    return 'error'
  }

  return 'default'
}

function TrackingSkeleton() {
  return (
    <div className="bg-white">
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-16 lg:py-20">
          <div className="h-3 w-32 animate-pulse rounded-full bg-black/5" />
          <div className="mt-5 h-16 w-96 max-w-full animate-pulse rounded-xl bg-black/5" />
          <div className="mt-5 h-5 w-[32rem] max-w-full animate-pulse rounded-full bg-black/5" />
        </div>
      </section>

      <section className="site-container py-16">
        <div className="mx-auto max-w-5xl">
          <div className="h-36 animate-pulse rounded-[2rem] bg-black/5" />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-[1.5rem] bg-black/5"
              />
            ))}
          </div>

          <div className="mt-10 h-72 animate-pulse rounded-[2rem] bg-black/5" />
        </div>
      </section>
    </div>
  )
}
