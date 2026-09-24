import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ImageOff, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/reprises_/$tradeInId')({
  component: AdminTradeInDetailPage,
})

type TradeInStatus =
  'pending' | 'reviewing' | 'accepted' | 'rejected' | 'closed'

type AdminTradeInDetail = {
  id: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  bikeBrand: string | null
  bikeModel: string | null
  bikeYear: number | null
  description: string | null
  desiredPriceCents: string | null
  offeredPriceCents: string | null
  status: TradeInStatus
  createdAt: string
  updatedAt: string
}

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
    dateStyle: 'medium',
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

function DetailValue({
  label,
  children,
}: {
  label: string
  children: ReactNode
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

function AdminTradeInDetailPage() {
  const { tradeInId } = Route.useParams()

  const [tradeIn, setTradeIn] = useState<AdminTradeInDetail | null>(null)
  const [loadState, setLoadState] = useState<
    'loading' | 'ready' | 'not-found' | 'error'
  >('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadTradeIn() {
      setLoadState('loading')

      try {
        const loadedTradeIn = await apiRequest<AdminTradeInDetail>(
          `/admin/trade-ins/${tradeInId}`,
        )

        if (cancelled) {
          return
        }

        setTradeIn(loadedTradeIn)
        setLoadState('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof ApiClientError && error.code === 'NOT_FOUND') {
          setTradeIn(null)
          setLoadState('not-found')
          return
        }

        setTradeIn(null)
        setLoadState('error')
      }
    }

    void loadTradeIn()

    return () => {
      cancelled = true
    }
  }, [tradeInId, loadAttempt])

  if (loadState === 'loading') {
    return (
      <AdminShell title="Reprises" eyebrow="Demandes clients">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Détail de la reprise">
            <div
              role="status"
              className="flex min-h-64 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Chargement de la reprise…
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (loadState === 'not-found') {
    return (
      <AdminShell title="Reprises" eyebrow="Demandes clients">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Reprise introuvable">
            <div className="p-6">
              <p className="type-secondary text-muted-foreground">
                Cette demande de reprise n’existe pas.
              </p>

              <a
                href="/admin/reprises"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Retour aux reprises
              </a>
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (loadState === 'error' || !tradeIn) {
    return (
      <AdminShell title="Reprises" eyebrow="Demandes clients">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Impossible de charger la reprise">
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
    <AdminShell title="Reprises" eyebrow="Demandes clients">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <a
            href="/admin/reprises"
            className="type-secondary mb-5 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour aux reprises
          </a>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">
                Reprise #{tradeIn.id}
              </h2>
              <p className="type-secondary mt-2 text-muted-foreground">
                Reçue le {formatDate(tradeIn.createdAt)}
              </p>
            </div>

            <StatusBadge tone={statusTone(tradeIn.status)}>
              {statusLabel(tradeIn.status)}
            </StatusBadge>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <AdminPanel title="Client">
              <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
                <DetailValue label="Nom">
                  <span className="text-foreground">
                    {tradeIn.customerFirstName} {tradeIn.customerLastName}
                  </span>
                </DetailValue>

                <DetailValue label="Téléphone">
                  <a
                    href={`tel:${tradeIn.customerPhone}`}
                    className="text-foreground hover:underline"
                  >
                    {tradeIn.customerPhone}
                  </a>
                </DetailValue>

                <DetailValue label="Email">
                  <a
                    href={`mailto:${tradeIn.customerEmail}`}
                    className="break-all text-foreground hover:underline"
                  >
                    {tradeIn.customerEmail}
                  </a>
                </DetailValue>
              </div>
            </AdminPanel>

            <AdminPanel title="Informations vélo">
              <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
                <DetailValue label="Marque">
                  <span className="text-foreground">
                    {tradeIn.bikeBrand ?? 'Non renseignée'}
                  </span>
                </DetailValue>

                <DetailValue label="Modèle">
                  <span className="text-foreground">
                    {tradeIn.bikeModel ?? 'Non renseigné'}
                  </span>
                </DetailValue>

                <DetailValue label="Année">
                  <span className="text-foreground">
                    {tradeIn.bikeYear ?? 'Non renseignée'}
                  </span>
                </DetailValue>

                <DetailValue label="Prix souhaité">
                  <span className="text-foreground">
                    {formatPrice(tradeIn.desiredPriceCents)}
                  </span>
                </DetailValue>
              </div>
            </AdminPanel>
          </div>

          <AdminPanel title="Description">
            <div className="p-5 lg:p-6">
              {tradeIn.description ? (
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {tradeIn.description}
                </p>
              ) : (
                <p className="type-secondary text-muted-foreground">
                  Aucune description fournie.
                </p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel title="Photos">
            <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
              <ImageOff
                aria-hidden="true"
                className="size-7 text-muted-foreground"
              />
              <p className="mt-4 font-medium">Aucune photo disponible</p>
              <p className="type-secondary mt-2 max-w-lg text-muted-foreground">
                Le formulaire public actuel ne permet pas encore de joindre des
                photos à une demande de reprise.
              </p>
            </div>
          </AdminPanel>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminPanel title="Évaluation">
              <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
                <DetailValue label="Prix souhaité">
                  <span className="text-foreground">
                    {formatPrice(tradeIn.desiredPriceCents)}
                  </span>
                </DetailValue>

                <DetailValue label="Prix proposé">
                  <span className="text-foreground">
                    {formatPrice(tradeIn.offeredPriceCents)}
                  </span>
                </DetailValue>
              </div>
            </AdminPanel>

            <AdminPanel title="Suivi">
              <div className="grid gap-6 p-5 sm:grid-cols-2 lg:p-6">
                <DetailValue label="Statut">
                  <StatusBadge tone={statusTone(tradeIn.status)}>
                    {statusLabel(tradeIn.status)}
                  </StatusBadge>
                </DetailValue>

                <DetailValue label="Dernière mise à jour">
                  <span className="text-foreground">
                    {formatDate(tradeIn.updatedAt)}
                  </span>
                </DetailValue>
              </div>
            </AdminPanel>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
