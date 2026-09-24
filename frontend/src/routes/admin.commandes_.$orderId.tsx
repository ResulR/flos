import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/commandes_/$orderId')({
  component: AdminOrderDetailPage,
})

type AdminOrderStatus =
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

type AdminOrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

type AdminOrderDetail = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  fulfillmentMethod: 'delivery' | 'pickup'
  deliveryAddressLine1: string | null
  deliveryAddressLine2: string | null
  deliveryPostalCode: string | null
  deliveryCity: string | null
  deliveryCountry: string | null
  status: AdminOrderStatus
  paymentStatus: AdminOrderPaymentStatus
  subtotalCents: string
  deliveryFeeCents: string
  totalCents: string
  currency: 'EUR'
  reservationId: string | null
  items: Array<{
    productId: string
    productName: string
    unitPriceCents: string
  }>
  createdAt: string
  updatedAt: string
}

function paymentLabel(status: AdminOrderPaymentStatus) {
  switch (status) {
    case 'pending':
      return 'En attente'
    case 'paid':
      return 'Payé'
    case 'failed':
      return 'Échoué'
    case 'expired':
      return 'Expiré'
  }
}

function paymentTone(status: AdminOrderPaymentStatus) {
  if (status === 'paid') {
    return 'positive' as const
  }

  if (status === 'pending') {
    return 'warning' as const
  }

  return 'neutral' as const
}

function orderStatusLabel(status: AdminOrderStatus) {
  switch (status) {
    case 'pending_payment':
      return 'Paiement en attente'
    case 'payment_failed':
      return 'Paiement échoué'
    case 'payment_expired':
      return 'Paiement expiré'
    case 'confirmed':
      return 'Confirmée'
    case 'preparing':
      return 'En préparation'
    case 'shipped':
      return 'Expédiée'
    case 'completed':
      return 'Terminée'
    case 'ready':
      return 'Prête'
    case 'picked_up':
      return 'Retirée'
    case 'cancelled':
      return 'Annulée'
  }
}

function orderStatusTone(status: AdminOrderStatus) {
  if (
    status === 'confirmed' ||
    status === 'preparing' ||
    status === 'ready' ||
    status === 'shipped'
  ) {
    return 'warning' as const
  }

  if (status === 'completed' || status === 'picked_up') {
    return 'positive' as const
  }

  return 'neutral' as const
}

function formatPrice(priceCents: string, currency: string) {
  const cents = Number(priceCents)

  if (!Number.isSafeInteger(cents)) {
    return '—'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function DetailValue({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="type-label">{label}</p>
      <div className="type-secondary mt-2 text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

function AdminOrderDetailPage() {
  const { orderId } = Route.useParams()

  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loadState, setLoadState] = useState<
    'loading' | 'ready' | 'not-found' | 'error'
  >('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      setLoadState('loading')

      try {
        const loadedOrder = await apiRequest<AdminOrderDetail>(
          `/admin/orders/${orderId}`,
        )

        if (cancelled) {
          return
        }

        setOrder(loadedOrder)
        setLoadState('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof ApiClientError && error.code === 'NOT_FOUND') {
          setOrder(null)
          setLoadState('not-found')
          return
        }

        setOrder(null)
        setLoadState('error')
      }
    }

    void loadOrder()

    return () => {
      cancelled = true
    }
  }, [orderId, loadAttempt])

  if (loadState === 'loading') {
    return (
      <AdminShell title="Commandes" eyebrow="Ventes">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Détail de la commande">
            <div
              role="status"
              className="flex min-h-64 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Chargement de la commande…
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (loadState === 'not-found') {
    return (
      <AdminShell title="Commandes" eyebrow="Ventes">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Commande introuvable">
            <div className="p-6">
              <p className="type-secondary text-muted-foreground">
                Cette commande n’existe pas.
              </p>

              <a
                href="/admin/commandes"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Retour aux commandes
              </a>
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (loadState === 'error' || !order) {
    return (
      <AdminShell title="Commandes" eyebrow="Ventes">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Impossible de charger la commande">
            <div className="p-6">
              <p className="type-secondary text-muted-foreground">
                Vérifiez la connexion au serveur puis réessayez.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => setLoadAttempt((current) => current + 1)}
              >
                Réessayer
              </Button>
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Commandes" eyebrow="Ventes">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <a
            href="/admin/commandes"
            className="type-secondary mb-5 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour aux commandes
          </a>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">
                Commande #{order.id}
              </h2>

              <p className="type-secondary mt-2 text-muted-foreground">
                Créée le {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={paymentTone(order.paymentStatus)}>
                {paymentLabel(order.paymentStatus)}
              </StatusBadge>

              <StatusBadge tone={orderStatusTone(order.status)}>
                {orderStatusLabel(order.status)}
              </StatusBadge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AdminPanel title="Client">
              <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
                <DetailValue label="Nom">
                  {order.customerFirstName} {order.customerLastName}
                </DetailValue>

                <DetailValue label="Téléphone">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-foreground hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </DetailValue>

                <DetailValue label="Email">
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="break-all text-foreground hover:underline"
                  >
                    {order.customerEmail}
                  </a>
                </DetailValue>

                {order.reservationId ? (
                  <DetailValue label="Réservation d’origine">
                    #{order.reservationId}
                  </DetailValue>
                ) : null}
              </div>
            </AdminPanel>

            <AdminPanel title="Remise">
              <div className="space-y-6 p-5 lg:p-6">
                <DetailValue label="Mode">
                  {order.fulfillmentMethod === 'delivery'
                    ? 'Livraison'
                    : 'Retrait'}
                </DetailValue>

                {order.fulfillmentMethod === 'delivery' ? (
                  <DetailValue label="Adresse de livraison">
                    <address className="not-italic text-foreground">
                      <div>{order.deliveryAddressLine1}</div>

                      {order.deliveryAddressLine2 ? (
                        <div>{order.deliveryAddressLine2}</div>
                      ) : null}

                      <div>
                        {order.deliveryPostalCode} {order.deliveryCity}
                      </div>

                      <div>{order.deliveryCountry}</div>
                    </address>
                  </DetailValue>
                ) : (
                  <p className="type-secondary text-muted-foreground">
                    La commande sera remise directement au client sur place.
                  </p>
                )}
              </div>
            </AdminPanel>
          </div>

          <AdminPanel
            title="Vélos"
            description={`${order.items.length} ${
              order.items.length > 1 ? 'vélos' : 'vélo'
            } dans cette commande.`}
          >
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="type-secondary mt-1 text-muted-foreground">
                      Produit #{item.productId}
                    </p>
                  </div>

                  <p className="font-medium">
                    {formatPrice(item.unitPriceCents, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </AdminPanel>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminPanel title="Paiement et traitement">
              <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
                <DetailValue label="Paiement">
                  <StatusBadge tone={paymentTone(order.paymentStatus)}>
                    {paymentLabel(order.paymentStatus)}
                  </StatusBadge>
                </DetailValue>

                <DetailValue label="Traitement">
                  <StatusBadge tone={orderStatusTone(order.status)}>
                    {orderStatusLabel(order.status)}
                  </StatusBadge>
                </DetailValue>
              </div>
            </AdminPanel>

            <AdminPanel title="Montants">
              <div className="space-y-4 p-5 lg:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="type-secondary text-muted-foreground">
                    Sous-total
                  </span>
                  <span className="font-medium">
                    {formatPrice(order.subtotalCents, order.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="type-secondary text-muted-foreground">
                    Livraison
                  </span>
                  <span className="font-medium">
                    {formatPrice(order.deliveryFeeCents, order.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-medium">
                    {formatPrice(order.totalCents, order.currency)}
                  </span>
                </div>
              </div>
            </AdminPanel>
          </div>

          <AdminPanel title="Historique">
            <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
              <DetailValue label="Créée">
                {formatDate(order.createdAt)}
              </DetailValue>

              <DetailValue label="Dernière mise à jour">
                {formatDate(order.updatedAt)}
              </DetailValue>
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  )
}
