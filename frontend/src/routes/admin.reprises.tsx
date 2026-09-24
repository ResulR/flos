import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/reprises')({
  component: AdminTradeInsPage,
})

type TradeInStatus =
  'pending' | 'reviewing' | 'accepted' | 'rejected' | 'closed'

type AdminTradeIn = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  bikeBrand: string | null
  bikeModel: string | null
  bikeYear: number | null
  desiredPriceCents: string | null
  offeredPriceCents: string | null
  status: TradeInStatus
  createdAt: string
  updatedAt: string
}

type TradeInFilter = 'all' | TradeInStatus

function statusLabel(status: TradeInStatus) {
  switch (status) {
    case 'pending':
      return 'Nouvelle'
    case 'reviewing':
      return 'En cours'
    case 'accepted':
      return 'Acceptée'
    case 'rejected':
      return 'Refusée'
    case 'closed':
      return 'Clôturée'
  }
}

function statusTone(status: TradeInStatus) {
  if (status === 'pending' || status === 'reviewing') {
    return 'warning' as const
  }

  if (status === 'accepted') {
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
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatPrice(value: string | null) {
  if (value === null) {
    return '—'
  }

  const cents = Number(value)

  if (!Number.isSafeInteger(cents)) {
    return '—'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

function bikeLabel(tradeIn: AdminTradeIn) {
  const parts = [tradeIn.bikeBrand, tradeIn.bikeModel].filter(Boolean)

  if (tradeIn.bikeYear !== null) {
    parts.push(String(tradeIn.bikeYear))
  }

  return parts.length > 0 ? parts.join(' · ') : 'Informations non fournies'
}

function AdminTradeInsPage() {
  const [tradeIns, setTradeIns] = useState<AdminTradeIn[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [statusFilter, setStatusFilter] = useState<TradeInFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadTradeIns() {
      setState('loading')

      try {
        const data = await apiRequest<AdminTradeIn[]>('/admin/trade-ins')

        if (cancelled) {
          return
        }

        setTradeIns(data)
        setState('ready')
      } catch {
        if (!cancelled) {
          setTradeIns([])
          setState('error')
        }
      }
    }

    void loadTradeIns()

    return () => {
      cancelled = true
    }
  }, [attempt])

  const visibleTradeIns = useMemo(() => {
    if (statusFilter === 'all') {
      return tradeIns
    }

    return tradeIns.filter((tradeIn) => tradeIn.status === statusFilter)
  }, [statusFilter, tradeIns])

  return (
    <AdminShell title="Reprises" eyebrow="Demandes clients">
      <AdminPanel
        title="Demandes de reprise"
        description="Les demandes les plus récentes apparaissent en premier."
      >
        <div className="border-b border-border p-5">
          <label className="block max-w-xs">
            <span className="type-label mb-2 block">Statut</span>
            <select
              className="form-control w-full"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as TradeInFilter)
              }
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">Nouvelle</option>
              <option value="reviewing">En cours</option>
              <option value="accepted">Acceptée</option>
              <option value="rejected">Refusée</option>
              <option value="closed">Clôturée</option>
            </select>
          </label>
        </div>

        {state === 'loading' ? (
          <div
            role="status"
            className="flex min-h-56 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
          >
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Chargement des reprises…
          </div>
        ) : state === 'error' ? (
          <div className="p-6">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-medium">
                Impossible de charger les demandes de reprise.
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
        ) : tradeIns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">Aucune demande de reprise</p>
            <p className="type-secondary mt-2 text-muted-foreground">
              Les nouvelles demandes apparaîtront ici automatiquement.
            </p>
          </div>
        ) : visibleTradeIns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">Aucune reprise avec ce statut</p>
            <p className="type-secondary mt-2 text-muted-foreground">
              Modifiez le filtre pour afficher les autres demandes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[76rem] w-full text-left text-sm">
              <thead className="bg-brand-gray-50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Reprise</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Vélo</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Prix souhaité
                  </th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleTradeIns.map((tradeIn) => (
                  <tr
                    key={tradeIn.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-5 py-4 font-medium">#{tradeIn.id}</td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(tradeIn.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {tradeIn.customerFirstName} {tradeIn.customerLastName}
                      </p>
                      <a
                        href={`mailto:${tradeIn.customerEmail}`}
                        className="type-secondary mt-1 block text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {tradeIn.customerEmail}
                      </a>
                      <a
                        href={`tel:${tradeIn.customerPhone}`}
                        className="type-secondary mt-1 block text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {tradeIn.customerPhone}
                      </a>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">{bikeLabel(tradeIn)}</p>
                    </td>

                    <td className="px-5 py-4 text-right font-medium">
                      {formatPrice(tradeIn.desiredPriceCents)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge tone={statusTone(tradeIn.status)}>
                        {statusLabel(tradeIn.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/admin/reprises/${tradeIn.id}`}
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
