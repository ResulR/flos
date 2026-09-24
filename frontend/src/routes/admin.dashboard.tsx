import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import {
  AdminPanel,
  MetricCard,
  StatusBadge,
} from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
})

type SalesPeriod = 'currentMonth' | 'allTime'

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

type AdminDashboardData = {
  sales: {
    currentMonth: {
      count: number
      revenueCents: string
    }
    allTime: {
      count: number
      revenueCents: string
    }
  }
  availableProductsCount: number
  activeReservationsCount: number
  pendingTradeInsCount: number
  recentOrders: Array<{
    id: string
    customerFirstName: string
    customerLastName: string
    status: AdminOrderStatus
    paymentStatus: AdminOrderPaymentStatus
    totalCents: string
    currency: 'EUR'
    createdAt: string
  }>
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

function formatPrice(priceCents: string, currency = 'EUR') {
  const cents = Number(priceCents)

  if (!Number.isSafeInteger(cents)) {
    return '—'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
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

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [period, setPeriod] = useState<SalesPeriod>('currentMonth')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setState('loading')

      try {
        const result = await apiRequest<AdminDashboardData>('/admin/dashboard')

        if (cancelled) {
          return
        }

        setDashboard(result)
        setState('ready')
      } catch {
        if (!cancelled) {
          setDashboard(null)
          setState('error')
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [attempt])

  const selectedSales = dashboard?.sales[period]
  const periodLabel =
    period === 'currentMonth' ? 'Mois en cours' : 'Depuis toujours'

  return (
    <AdminShell title="Dashboard" eyebrow="Vue opérationnelle">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">
            Activité commerciale
          </h2>
          <p className="type-secondary mt-2 text-muted-foreground">
            Suivez les ventes et les éléments qui demandent votre attention.
          </p>
        </div>

        <div className="flex w-fit gap-2" aria-label="Période des ventes">
          <Button
            type="button"
            variant={period === 'currentMonth' ? 'default' : 'outline'}
            aria-pressed={period === 'currentMonth'}
            onClick={() => setPeriod('currentMonth')}
          >
            Mois en cours
          </Button>

          <Button
            type="button"
            variant={period === 'allTime' ? 'default' : 'outline'}
            aria-pressed={period === 'allTime'}
            onClick={() => setPeriod('allTime')}
          >
            Depuis toujours
          </Button>
        </div>
      </div>

      {state === 'loading' ? (
        <div
          role="status"
          className="flex min-h-72 items-center justify-center gap-3 rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          Chargement du dashboard…
        </div>
      ) : state === 'error' || !dashboard || !selectedSales ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium">Impossible de charger le dashboard.</p>
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
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Ventes"
              value={formatCount(selectedSales.count)}
              detail={periodLabel}
            />
            <MetricCard
              label="Chiffre d’affaires"
              value={formatPrice(selectedSales.revenueCents)}
              detail={periodLabel}
            />
            <MetricCard
              label="Vélos disponibles"
              value={formatCount(dashboard.availableProductsCount)}
            />
            <MetricCard
              label="Réservations actives"
              value={formatCount(dashboard.activeReservationsCount)}
            />
            <MetricCard
              label="Nouvelles reprises"
              value={formatCount(dashboard.pendingTradeInsCount)}
            />
          </div>

          <div className="mt-8">
            <AdminPanel
              title="Commandes récentes"
              description="Les 5 dernières commandes, toutes périodes confondues."
            >
              {dashboard.recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-medium">Aucune commande</p>
                  <p className="type-secondary mt-2 text-muted-foreground">
                    Les dernières commandes apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[58rem] w-full text-left text-sm">
                    <thead className="bg-brand-gray-50 text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-medium">Commande</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Client</th>
                        <th className="px-5 py-3 font-medium">Paiement</th>
                        <th className="px-5 py-3 font-medium">Statut</th>
                        <th className="px-5 py-3 text-right font-medium">
                          Montant
                        </th>
                        <th className="px-5 py-3 text-right font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard.recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t border-border align-middle"
                        >
                          <td className="px-5 py-4 font-medium">#{order.id}</td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            {order.customerFirstName} {order.customerLastName}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              tone={paymentTone(order.paymentStatus)}
                            >
                              {paymentLabel(order.paymentStatus)}
                            </StatusBadge>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge tone={orderStatusTone(order.status)}>
                              {orderStatusLabel(order.status)}
                            </StatusBadge>
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
          </div>
        </>
      )}
    </AdminShell>
  )
}
