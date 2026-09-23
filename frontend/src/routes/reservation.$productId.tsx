import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Clock3 } from 'lucide-react'

import { FlowState } from '@/components/feedback/flow-state'
import { PublicPage } from '@/components/layout/public-page'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { ApiClientError, apiRequest, buildApiUrl } from '@/lib/api'

export const Route = createFileRoute('/reservation/$productId')({
  component: ReservationPage,
})

type ReservationProduct = {
  id: string
  brand: string
  model: string
  priceCents: string
  status: 'available' | 'reserved' | 'sold'
  reservedUntil: string | null
  media: Array<{
    id: string
    imageUrl: string
  }>
}

type CreatedReservation = {
  id: string
  productId: string
  expiresAt: string
  status: 'active'
}

type ReservationForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  durationDays: 1 | 2 | 3
}

type ReservationFieldErrors = Partial<
  Record<'firstName' | 'lastName' | 'email' | 'phone' | 'durationDays', string>
>

const initialForm: ReservationForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  durationDays: 1,
}

function formatPrice(priceCents: string) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(priceCents) / 100)
}

function formatExpiration(value: string | Date) {
  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

function ReservationPage() {
  const { productId } = Route.useParams()
  const [product, setProduct] = useState<ReservationProduct | null>(null)
  const [form, setForm] = useState<ReservationForm>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<ReservationFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<CreatedReservation | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [estimatedExpiration, setEstimatedExpiration] = useState<Date | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const data = await apiRequest<ReservationProduct>(
          `/products/${productId}`,
        )

        if (!cancelled) {
          setProduct(data)
          setEstimatedExpiration(new Date(Date.now() + 24 * 60 * 60 * 1000))
        }
      } catch {
        if (!cancelled) {
          setProduct(null)
          setLoadError('Impossible de charger ce vélo.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProduct()

    return () => {
      cancelled = true
    }
  }, [productId])

  function updateField<K extends keyof ReservationForm>(
    field: K,
    value: ReservationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (field === 'durationDays') {
      const durationDays = value as ReservationForm['durationDays']

      setEstimatedExpiration(
        new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      )
    }

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!product || product.status !== 'available' || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    try {
      const createdReservation = await apiRequest<CreatedReservation>(
        '/reservations',
        {
          method: 'POST',
          body: {
            productId: product.id,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            durationDays: form.durationDays,
          },
        },
      )

      setReservation(createdReservation)
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR' && error.fields) {
          setFieldErrors({
            firstName: error.fields['body.firstName'],
            lastName: error.fields['body.lastName'],
            email: error.fields['body.email'],
            phone: error.fields['body.phone'],
            durationDays: error.fields['body.durationDays'],
          })

          setSubmitError('Vérifiez les informations du formulaire.')
        } else if (error.code === 'PRODUCT_NOT_AVAILABLE') {
          setSubmitError(
            'Ce vélo vient de devenir indisponible. Il ne peut plus être réservé.',
          )
        } else if (error.code === 'RESERVATION_LIMIT_REACHED') {
          setSubmitError(
            'Une réservation active existe déjà avec cet email ou ce téléphone.',
          )
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError('Impossible de créer la réservation.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PublicPage>
        <section className="site-container section-space">
          <FlowState
            kind="loading"
            title="Chargement du vélo"
            description="Les informations du vélo sont en cours de chargement."
          />
        </section>
      </PublicPage>
    )
  }

  if (loadError || !product) {
    return (
      <PublicPage>
        <section className="site-container section-space">
          <FlowState
            kind="error"
            title="Vélo indisponible"
            description={loadError ?? 'Ce vélo est introuvable.'}
          />
        </section>
      </PublicPage>
    )
  }

  const isReserved = reservation !== null || product.status === 'reserved'
  const isUnavailable = product.status !== 'available' && !reservation
  const firstMedia = product.media[0] ?? null

  return (
    <PublicPage>
      <section className="site-container py-10 lg:py-14">
        <a
          href={`/produits/${product.id}`}
          className="type-secondary inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour au vélo
        </a>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="type-label uppercase tracking-[0.16em] text-primary">
              Réservation gratuite
            </p>

            <h1 className="type-display mt-3">Garder ce vélo de côté.</h1>

            <p className="type-body mt-5 max-w-2xl text-muted-foreground">
              Une réservation rend immédiatement le vélo indisponible à l’achat
              et aux autres réservations pendant la durée choisie.
            </p>

            {reservation ? (
              <div
                role="status"
                className="mt-10 rounded-lg border border-border bg-brand-gray-50 p-6"
              >
                <div className="flex gap-3">
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                  />

                  <div>
                    <h2 className="type-heading-3">Réservation confirmée</h2>
                    <p className="type-body mt-2 text-muted-foreground">
                      Ce vélo est maintenant réservé pour vous jusqu’au{' '}
                      {formatExpiration(reservation.expiresAt)}.
                    </p>
                  </div>
                </div>
              </div>
            ) : isUnavailable ? (
              <div className="mt-10">
                <FlowState
                  kind="error"
                  title={
                    product.status === 'reserved'
                      ? 'Vélo déjà réservé'
                      : 'Vélo indisponible'
                  }
                  description={
                    product.status === 'reserved' && product.reservedUntil
                      ? `Ce vélo est réservé jusqu’au ${formatExpiration(product.reservedUntil)}.`
                      : 'Ce vélo ne peut actuellement pas être réservé.'
                  }
                />
              </div>
            ) : (
              <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Prénom"
                    name="firstName"
                    autoComplete="given-name"
                    value={form.firstName}
                    error={fieldErrors.firstName}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateField('firstName', event.target.value)
                    }
                  />

                  <TextField
                    label="Nom"
                    name="lastName"
                    autoComplete="family-name"
                    value={form.lastName}
                    error={fieldErrors.lastName}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateField('lastName', event.target.value)
                    }
                  />

                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    error={fieldErrors.email}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateField('email', event.target.value)
                    }
                  />

                  <TextField
                    label="Téléphone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    error={fieldErrors.phone}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      updateField('phone', event.target.value)
                    }
                  />
                </div>

                <fieldset
                  className="border-t border-border pt-8"
                  disabled={isSubmitting}
                >
                  <legend className="type-heading-3">Durée</legend>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {([1, 2, 3] as const).map((day) => (
                      <label
                        key={day}
                        className="surface-card cursor-pointer p-4 text-center"
                      >
                        <input
                          type="radio"
                          name="durationDays"
                          value={day}
                          checked={form.durationDays === day}
                          onChange={() => updateField('durationDays', day)}
                          className="mb-3 accent-brand-red"
                        />
                        <span className="block font-medium">
                          {day} {day === 1 ? 'jour' : 'jours'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {fieldErrors.durationDays ? (
                    <p className="type-secondary mt-2 text-destructive">
                      {fieldErrors.durationDays}
                    </p>
                  ) : null}
                </fieldset>

                <div className="rounded-lg bg-brand-gray-50 p-5">
                  <div className="flex gap-3">
                    <Clock3
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <div>
                      <p className="font-medium">Expiration estimée</p>
                      <p className="type-secondary mt-1 text-muted-foreground">
                        {estimatedExpiration
                          ? `En confirmant maintenant, la réservation expirerait environ le ${formatExpiration(estimatedExpiration)}.`
                          : 'Calcul de l’expiration…'}{' '}
                        L’heure exacte sera calculée par le serveur.
                      </p>
                    </div>
                  </div>
                </div>

                {submitError ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                  >
                    {submitError}
                  </p>
                ) : null}

                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Réservation en cours…'
                    : 'Confirmer la réservation gratuite'}
                </Button>
              </form>
            )}
          </div>

          <aside className="surface-card h-fit p-6">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-brand-gray-100">
              {firstMedia ? (
                <img
                  src={buildApiUrl(firstMedia.imageUrl)}
                  alt={`${product.brand} ${product.model}`}
                  className="size-full object-cover"
                />
              ) : null}
            </div>

            <p className="type-secondary mt-5 uppercase tracking-[0.08em] text-muted-foreground">
              {product.brand}
            </p>

            <h2 className="type-product-title mt-1">{product.model}</h2>

            <p className="type-price mt-4">{formatPrice(product.priceCents)}</p>

            <div className="mt-6 border-t border-border pt-5">
              <p
                className={`text-sm font-medium ${
                  isReserved ? 'text-muted-foreground' : 'text-primary'
                }`}
              >
                {isReserved
                  ? 'Réservé'
                  : product.status === 'available'
                    ? 'Disponible'
                    : 'Vendu'}
              </p>

              {reservation ? (
                <p className="type-secondary mt-2 text-muted-foreground">
                  Jusqu’au {formatExpiration(reservation.expiresAt)}
                </p>
              ) : product.status === 'reserved' && product.reservedUntil ? (
                <p className="type-secondary mt-2 text-muted-foreground">
                  Jusqu’au {formatExpiration(product.reservedUntil)}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </PublicPage>
  )
}
