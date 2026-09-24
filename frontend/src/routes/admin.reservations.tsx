import { createFileRoute } from '@tanstack/react-router'
import { Clock3, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/reservations')({
  component: AdminReservationsPage,
})

type ReservationStatus = 'active' | 'cancelled' | 'expired' | 'converted'

type AdminReservation = {
  id: string
  productId: string
  productBrand: string
  productModel: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  status: ReservationStatus
  startsAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  cancelledAt: string | null
  convertedAt: string | null
}

function statusLabel(status: ReservationStatus) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'cancelled':
      return 'Annulée'
    case 'expired':
      return 'Expirée'
    case 'converted':
      return 'Convertie'
  }
}

function statusTone(status: ReservationStatus) {
  if (status === 'active') {
    return 'warning' as const
  }

  if (status === 'converted') {
    return 'positive' as const
  }

  return 'neutral' as const
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

function AdminReservationsPage() {
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadReservations() {
      setState('loading')

      try {
        const data = await apiRequest<AdminReservation[]>('/admin/reservations')

        if (cancelled) {
          return
        }

        setReservations(data)
        setState('ready')
      } catch {
        if (!cancelled) {
          setReservations([])
          setState('error')
        }
      }
    }

    void loadReservations()

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  return (
    <AdminShell title="Réservations" eyebrow="Disponibilité">
      <AdminPanel
        title="Réservations"
        description="Consultez les vélos actuellement bloqués et l’historique des réservations."
      >
        {state === 'loading' ? (
          <div
            role="status"
            className="flex min-h-64 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
          >
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Chargement des réservations…
          </div>
        ) : state === 'error' ? (
          <div className="p-6">
            <p className="type-secondary text-muted-foreground">
              Impossible de charger les réservations.
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
        ) : reservations.length === 0 ? (
          <div className="p-6">
            <p className="type-secondary text-muted-foreground">
              Aucune réservation pour le moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[64rem] w-full text-left text-sm">
              <thead className="bg-brand-gray-50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Réservation</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Vélo</th>
                  <th className="px-5 py-3 font-medium">Créée</th>
                  <th className="px-5 py-3 font-medium">Expiration</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-5 py-4 font-medium">#{reservation.id}</td>

                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {reservation.customerFirstName}{' '}
                        {reservation.customerLastName}
                      </p>
                      <a
                        href={`mailto:${reservation.customerEmail}`}
                        className="type-secondary mt-1 block text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {reservation.customerEmail}
                      </a>
                      <a
                        href={`tel:${reservation.customerPhone}`}
                        className="type-secondary mt-1 block text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {reservation.customerPhone}
                      </a>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {reservation.productBrand} {reservation.productModel}
                      </p>
                      <p className="type-secondary mt-1 text-muted-foreground">
                        Produit #{reservation.productId}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(reservation.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Clock3
                          aria-hidden="true"
                          className="size-4 shrink-0 text-primary"
                        />
                        <span>{formatDate(reservation.expiresAt)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge tone={statusTone(reservation.status)}>
                        {statusLabel(reservation.status)}
                      </StatusBadge>
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
