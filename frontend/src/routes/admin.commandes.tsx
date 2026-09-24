import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/commandes')({
  component: AdminOrdersPage,
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

type AdminOrderListItem = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  fulfillmentMethod: 'delivery' | 'pickup'
  status: AdminOrderStatus
  paymentStatus: AdminOrderPaymentStatus
  totalCents: string
  currency: 'EUR'
  createdAt: string
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
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      setState('loading')

      try {
        const result = await apiRequest<AdminOrderListItem[]>('/admin/orders')

        if (cancelled) {
          return
        }

        setOrders(result)
        setState('ready')
      } catch {
        if (!cancelled) {
          setState('error')
        }
      }
    }

    void loadOrders()

    return () => {
      cancelled = true
    }
  }, [attempt])

  return (
    <AdminShell title="Commandes" eyebrow="Ventes">
      <div className="mb-8">
        <h2 className="text-2xl font-medium tracking-tight">
          Toutes les commandes
        </h2>
        <p className="type-secondary mt-2 max-w-2xl text-muted-foreground">
          Suivez le paiement et l’avancement des ventes depuis une seule liste.
        </p>
      </div>

      <AdminPanel
        title="Commandes"
        description="Les plus récentes apparaissent en premier."
      >
        {state === 'loading' ? (
          <div
            role="status"
            className="flex min-h-56 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
          >
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Chargement des commandes…
          </div>
        ) : state === 'error' ? (
          <div className="p-6">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-medium">
                Impossible de charger les commandes.
              </p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Vérifiez la connexion au serveur puis réessayez.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setAttempt((current) => current + 1)}
              >
                Réessayer
              </Button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">Aucune commande</p>
            <p className="type-secondary mt-2 text-muted-foreground">
              Les commandes apparaîtront ici dès qu’une vente sera créée.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[68rem] w-full text-left text-sm">
              <thead className="bg-brand-gray-50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Commande</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Paiement</th>
                  <th className="px-5 py-3 font-medium">Traitement</th>
                  <th className="px-5 py-3 font-medium">Réception</th>
                  <th className="px-5 py-3 text-right font-medium">Montant</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-border align-middle"
                  >
                    <td className="px-5 py-4 font-medium">#{order.id}</td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {order.customerFirstName} {order.customerLastName}
                      </p>
                      <p className="type-secondary mt-1 text-muted-foreground">
                        {order.customerEmail}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge tone={paymentTone(order.paymentStatus)}>
                        {paymentLabel(order.paymentStatus)}
                      </StatusBadge>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge tone={orderStatusTone(order.status)}>
                        {orderStatusLabel(order.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-5 py-4">
                      {order.fulfillmentMethod === 'pickup'
                        ? 'Retrait'
                        : 'Livraison'}
                    </td>

                    <td className="px-5 py-4 text-right font-medium">
                      {formatPrice(order.totalCents, order.currency)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/admin/commandes/${order.id}`}
                        className="inline-flex min-h-10 items-center rounded-md border border-brand-black px-4 text-sm font-medium text-brand-black transition-colors hover:bg-brand-gray-50"
                      >
                        Ouvrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </AdminShell>
  )
}
