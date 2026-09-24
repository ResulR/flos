import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  LoaderCircle,
  Save,
} from 'lucide-react'
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

type EditableTradeInStatus = 'reviewing' | 'accepted' | 'rejected'

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

type TradeInInternalNote = {
  id: string
  internalNote: string | null
  updatedAt: string
}

type UpdatedTradeInOffer = {
  id: string
  offeredPriceCents: string
  updatedAt: string
}

type UpdatedTradeInStatus = {
  id: string
  status: EditableTradeInStatus
  updatedAt: string
}

type ActionType = 'offer' | 'note' | 'status'

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

function priceCentsToInput(value: string | null) {
  if (value === null) {
    return ''
  }

  const cents = Number(value)

  if (!Number.isSafeInteger(cents)) {
    return ''
  }

  return (cents / 100).toFixed(2).replace('.', ',')
}

function parseOfferPrice(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return { error: 'Prix proposé requis' }
  }

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) {
    return { error: 'Prix proposé invalide' }
  }

  const cents = Math.round(Number(trimmed.replace(',', '.')) * 100)

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return { error: 'Prix proposé invalide' }
  }

  return { value: cents }
}

function nextStatuses(status: TradeInStatus): EditableTradeInStatus[] {
  if (status === 'pending') {
    return ['reviewing']
  }

  if (status === 'reviewing') {
    return ['accepted', 'rejected']
  }

  return []
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

  const [offeredPrice, setOfferedPrice] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [selectedStatus, setSelectedStatus] =
    useState<EditableTradeInStatus | null>(null)

  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [offerError, setOfferError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTradeIn() {
      setLoadState('loading')
      setActionError(null)
      setSuccessMessage(null)

      try {
        const [loadedTradeIn, loadedNote] = await Promise.all([
          apiRequest<AdminTradeInDetail>(`/admin/trade-ins/${tradeInId}`),
          apiRequest<TradeInInternalNote>(
            `/admin/trade-ins/${tradeInId}/internal-note`,
          ),
        ])

        if (cancelled) {
          return
        }

        setTradeIn(loadedTradeIn)
        setOfferedPrice(priceCentsToInput(loadedTradeIn.offeredPriceCents))
        setInternalNote(loadedNote.internalNote ?? '')
        setSelectedStatus(nextStatuses(loadedTradeIn.status)[0] ?? null)
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

  function resetFeedback() {
    setActionError(null)
    setSuccessMessage(null)
  }

  async function saveOffer() {
    if (!tradeIn || activeAction) {
      return
    }

    resetFeedback()
    setOfferError(null)

    const parsed = parseOfferPrice(offeredPrice)

    if (parsed.error || parsed.value === undefined) {
      setOfferError(parsed.error ?? 'Prix proposé invalide')
      return
    }

    setActiveAction('offer')

    try {
      const updated = await apiRequest<UpdatedTradeInOffer>(
        `/admin/trade-ins/${tradeIn.id}/offer`,
        {
          method: 'PATCH',
          body: {
            offeredPriceCents: parsed.value,
          },
        },
      )

      setTradeIn((current) =>
        current
          ? {
              ...current,
              offeredPriceCents: updated.offeredPriceCents,
              updatedAt: updated.updatedAt,
            }
          : current,
      )
      setOfferedPrice(priceCentsToInput(updated.offeredPriceCents))
      setSuccessMessage('Le prix proposé a été enregistré.')
    } catch (error) {
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'Impossible d’enregistrer le prix proposé.',
      )
    } finally {
      setActiveAction(null)
    }
  }

  async function saveInternalNote() {
    if (!tradeIn || activeAction) {
      return
    }

    resetFeedback()
    setActiveAction('note')

    try {
      const trimmedNote = internalNote.trim()

      const updated = await apiRequest<TradeInInternalNote>(
        `/admin/trade-ins/${tradeIn.id}/internal-note`,
        {
          method: 'PATCH',
          body: {
            internalNote: trimmedNote || null,
          },
        },
      )

      setInternalNote(updated.internalNote ?? '')
      setTradeIn((current) =>
        current
          ? {
              ...current,
              updatedAt: updated.updatedAt,
            }
          : current,
      )
      setSuccessMessage(
        updated.internalNote
          ? 'La note interne a été enregistrée.'
          : 'La note interne a été effacée.',
      )
    } catch (error) {
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'Impossible d’enregistrer la note interne.',
      )
    } finally {
      setActiveAction(null)
    }
  }

  async function saveStatus() {
    if (!tradeIn || !selectedStatus || activeAction) {
      return
    }

    resetFeedback()
    setActiveAction('status')

    try {
      const updated = await apiRequest<UpdatedTradeInStatus>(
        `/admin/trade-ins/${tradeIn.id}/status`,
        {
          method: 'PATCH',
          body: {
            status: selectedStatus,
          },
        },
      )

      setTradeIn((current) =>
        current
          ? {
              ...current,
              status: updated.status,
              updatedAt: updated.updatedAt,
            }
          : current,
      )

      setSelectedStatus(nextStatuses(updated.status)[0] ?? null)
      setSuccessMessage('Le statut de la reprise a été mis à jour.')
    } catch (error) {
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'Impossible de modifier le statut.',
      )
    } finally {
      setActiveAction(null)
    }
  }

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

  const availableStatuses = nextStatuses(tradeIn.status)

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

        {successMessage ? (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-brand-gray-50 px-5 py-4 text-sm"
          >
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
            {successMessage}
          </div>
        ) : null}

        {actionError ? (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive"
          >
            {actionError}
          </div>
        ) : null}

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
            <AdminPanel
              title="Prix proposé"
              description="Montant proposé au client pour cette reprise."
            >
              <div className="p-5 lg:p-6">
                <label className="block">
                  <span className="type-label mb-2 block">
                    Prix proposé en euros
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    className="form-control w-full"
                    placeholder="Ex. 950"
                    value={offeredPrice}
                    onChange={(event) => {
                      setOfferedPrice(event.target.value)
                      setOfferError(null)
                    }}
                    disabled={activeAction !== null}
                  />

                  {offerError ? (
                    <p className="type-secondary mt-2 text-destructive">
                      {offerError}
                    </p>
                  ) : null}
                </label>

                <Button
                  type="button"
                  className="mt-5"
                  disabled={activeAction !== null}
                  onClick={() => void saveOffer()}
                >
                  {activeAction === 'offer' ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Save aria-hidden="true" className="size-4" />
                      Enregistrer le prix
                    </>
                  )}
                </Button>
              </div>
            </AdminPanel>

            <AdminPanel
              title="Statut"
              description="Les transitions suivent le workflow de traitement."
            >
              <div className="p-5 lg:p-6">
                <DetailValue label="Statut actuel">
                  <StatusBadge tone={statusTone(tradeIn.status)}>
                    {statusLabel(tradeIn.status)}
                  </StatusBadge>
                </DetailValue>

                {availableStatuses.length > 0 ? (
                  <>
                    <label className="mt-6 block">
                      <span className="type-label mb-2 block">
                        Nouveau statut
                      </span>

                      <select
                        className="form-control w-full"
                        value={selectedStatus ?? ''}
                        disabled={activeAction !== null}
                        onChange={(event) =>
                          setSelectedStatus(
                            event.target.value as EditableTradeInStatus,
                          )
                        }
                      >
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Button
                      type="button"
                      className="mt-5"
                      disabled={activeAction !== null || !selectedStatus}
                      onClick={() => void saveStatus()}
                    >
                      {activeAction === 'status' ? (
                        <>
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                          Enregistrement…
                        </>
                      ) : (
                        <>
                          <Save aria-hidden="true" className="size-4" />
                          Mettre à jour le statut
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <p className="type-secondary mt-6 text-muted-foreground">
                    Aucun changement de statut supplémentaire n’est autorisé.
                  </p>
                )}
              </div>
            </AdminPanel>
          </div>

          <AdminPanel
            title="Note interne"
            description="Visible uniquement dans l’administration."
          >
            <div className="p-5 lg:p-6">
              <label className="block">
                <span className="sr-only">Note interne</span>
                <textarea
                  rows={6}
                  className="form-control w-full py-3"
                  placeholder="Ajoutez ici les informations utiles au suivi de la reprise."
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  disabled={activeAction !== null}
                />
              </label>

              <Button
                type="button"
                className="mt-5"
                disabled={activeAction !== null}
                onClick={() => void saveInternalNote()}
              >
                {activeAction === 'note' ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save aria-hidden="true" className="size-4" />
                    Enregistrer la note
                  </>
                )}
              </Button>
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
    </AdminShell>
  )
}
