import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Check, Clock3, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { PublicPage } from '@/components/layout/public-page'
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
        <ReservationSkeleton />
      </PublicPage>
    )
  }

  if (loadError || !product) {
    return (
      <PublicPage>
        <section className="bg-white py-16 sm:py-20">
          <div className="site-container">
            <div className="mx-auto max-w-2xl rounded-[2rem] bg-red-50 px-6 py-14 text-center ring-1 ring-red-100">
              <h1 className="font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717]">
                Vélo indisponible
              </h1>

              <p className="mt-4 text-sm text-muted-foreground">
                {loadError ?? 'Ce vélo est introuvable.'}
              </p>
            </div>
          </div>
        </section>
      </PublicPage>
    )
  }

  const isReserved = reservation !== null || product.status === 'reserved'
  const isUnavailable = product.status !== 'available' && !reservation
  const firstMedia = product.media[0] ?? null

  return (
    <PublicPage>
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-10 sm:py-12">
          <a
            href={`/produits/${product.id}`}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#171717]"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
            />
            Retour au vélo
          </a>
        </div>
      </section>

      <section className="bg-[#f7f5f1] pb-16 sm:pb-20 lg:pb-24">
        <div className="site-container">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
                Réservation gratuite
              </p>

              <h1 className="mt-4 max-w-3xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.1rem,5.5vw,5.3rem)] font-normal leading-[0.95] tracking-[-0.055em] text-[#171717]">
                Garder ce vélo de côté.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
                Une réservation rend immédiatement ce vélo indisponible pour les
                autres clients pendant la durée choisie.
              </p>

              {reservation ? (
                <ReservationSuccess reservation={reservation} />
              ) : isUnavailable ? (
                <UnavailableState product={product} />
              ) : (
                <form className="mt-12" onSubmit={handleSubmit}>
                  <section>
                    <SectionHeading
                      number="01"
                      title="Vos coordonnées"
                      description="Nous utilisons ces informations uniquement pour identifier votre réservation."
                    />

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <TextField
                        label="Prénom"
                        name="firstName"
                        autoComplete="given-name"
                        value={form.firstName}
                        error={fieldErrors.firstName}
                        disabled={isSubmitting}
                        required
                        className="min-h-12 rounded-xl border-black/10 bg-white px-4"
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
                        required
                        className="min-h-12 rounded-xl border-black/10 bg-white px-4"
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
                        required
                        className="min-h-12 rounded-xl border-black/10 bg-white px-4"
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
                        required
                        className="min-h-12 rounded-xl border-black/10 bg-white px-4"
                        onChange={(event) =>
                          updateField('phone', event.target.value)
                        }
                      />
                    </div>
                  </section>

                  <section className="mt-12 border-t border-black/10 pt-12">
                    <SectionHeading
                      number="02"
                      title="Durée de réservation"
                      description="Choisissez combien de temps vous souhaitez garder ce vélo de côté."
                    />

                    <fieldset className="mt-7" disabled={isSubmitting}>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {([1, 2, 3] as const).map((day) => {
                          const selected = form.durationDays === day

                          return (
                            <label
                              key={day}
                              className={[
                                'cursor-pointer rounded-[1.5rem] p-5 ring-1 transition-all',
                                selected
                                  ? 'bg-white ring-[#b44a42]'
                                  : 'bg-white/60 ring-black/10 hover:ring-black/20',
                              ].join(' ')}
                            >
                              <input
                                type="radio"
                                name="durationDays"
                                value={day}
                                checked={selected}
                                onChange={() =>
                                  updateField('durationDays', day)
                                }
                                className="sr-only"
                              />

                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-2xl font-medium tracking-[-0.03em] text-[#171717]">
                                    {day}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {day === 1 ? 'jour' : 'jours'}
                                  </p>
                                </div>

                                <span
                                  className={[
                                    'flex size-8 items-center justify-center rounded-full',
                                    selected
                                      ? 'bg-[#b44a42] text-white'
                                      : 'bg-[#f7f5f1] text-transparent',
                                  ].join(' ')}
                                >
                                  <Check
                                    aria-hidden="true"
                                    className="size-4"
                                  />
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>

                      {fieldErrors.durationDays ? (
                        <p className="mt-3 text-sm text-red-700">
                          {fieldErrors.durationDays}
                        </p>
                      ) : null}
                    </fieldset>
                  </section>

                  <div className="mt-8 rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5 sm:p-6">
                    <div className="flex gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#b44a42]/10 text-[#b44a42]">
                        <Clock3 aria-hidden="true" className="size-5" />
                      </span>

                      <div>
                        <p className="text-sm font-medium text-[#171717]">
                          Expiration estimée
                        </p>

                        <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
                          {estimatedExpiration
                            ? `Si vous confirmez maintenant, la réservation expirera environ le ${formatExpiration(estimatedExpiration)}.`
                            : 'Calcul de l’expiration…'}{' '}
                          L’heure exacte sera déterminée par le serveur.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5 sm:p-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <ShieldCheck aria-hidden="true" className="size-5" />
                    </span>

                    <div>
                      <p className="text-sm font-medium text-[#171717]">
                        Une réservation active à la fois
                      </p>

                      <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
                        Une même adresse email ou un même numéro de téléphone ne
                        peut avoir qu’une réservation active.
                      </p>
                    </div>
                  </div>

                  {submitError ? (
                    <div
                      role="alert"
                      className="mt-6 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-800 ring-1 ring-red-100"
                    >
                      {submitError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#b44a42] px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#9d4039] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting
                      ? 'Réservation en cours…'
                      : 'Confirmer la réservation gratuite'}
                  </button>
                </form>
              )}
            </div>

            <aside className="h-fit lg:sticky lg:top-8">
              <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/5">
                <div className="aspect-[4/3] bg-[#f7f5f1]">
                  {firstMedia ? (
                    <img
                      src={buildApiUrl(firstMedia.imageUrl)}
                      alt={`${product.brand} ${product.model}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                      Photo indisponible
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#b44a42]">
                    {product.brand}
                  </p>

                  <h2 className="mt-2 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
                    {product.model}
                  </h2>

                  <p className="mt-5 text-2xl font-medium tracking-[-0.03em] text-[#171717]">
                    {formatPrice(product.priceCents)}
                  </p>

                  <div className="mt-6 border-t border-black/10 pt-5">
                    <ReservationStatus
                      product={product}
                      reservation={reservation}
                      isReserved={isReserved}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-5">
      <span className="pt-1 text-xs font-medium tracking-[0.14em] text-[#b44a42]">
        {number}
      </span>

      <div>
        <h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717] sm:text-4xl">
          {title}
        </h2>

        <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function ReservationSuccess({
  reservation,
}: {
  reservation: CreatedReservation
}) {
  return (
    <div
      role="status"
      className="mt-12 rounded-[2rem] bg-white p-7 ring-1 ring-emerald-100 sm:p-9"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Check aria-hidden="true" className="size-5" />
      </span>

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
        Réservation confirmée
      </p>

      <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717]">
        Ce vélo est maintenant à votre nom.
      </h2>

      <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
        Votre réservation est active jusqu’au{' '}
        <strong className="font-medium text-[#171717]">
          {formatExpiration(reservation.expiresAt)}
        </strong>
        .
      </p>
    </div>
  )
}

function UnavailableState({ product }: { product: ReservationProduct }) {
  return (
    <div className="mt-12 rounded-[2rem] bg-white p-7 ring-1 ring-black/5 sm:p-9">
      <h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
        {product.status === 'reserved'
          ? 'Ce vélo est déjà réservé.'
          : 'Ce vélo n’est plus disponible.'}
      </h2>

      <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
        {product.status === 'reserved' && product.reservedUntil
          ? `La réservation actuelle est prévue jusqu’au ${formatExpiration(product.reservedUntil)}.`
          : 'Il ne peut actuellement pas faire l’objet d’une nouvelle réservation.'}
      </p>
    </div>
  )
}

function ReservationStatus({
  product,
  reservation,
  isReserved,
}: {
  product: ReservationProduct
  reservation: CreatedReservation | null
  isReserved: boolean
}) {
  if (isReserved) {
    return (
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
          <Clock3 aria-hidden="true" className="size-4" />
          Réservé
        </p>

        {reservation ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Jusqu’au {formatExpiration(reservation.expiresAt)}
          </p>
        ) : product.reservedUntil ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Jusqu’au {formatExpiration(product.reservedUntil)}
          </p>
        ) : null}
      </div>
    )
  }

  if (product.status === 'available') {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <Check aria-hidden="true" className="size-4" />
        Disponible à la réservation
      </p>
    )
  }

  return <p className="text-sm font-medium text-muted-foreground">Vendu</p>
}

function ReservationSkeleton() {
  return (
    <div className="bg-[#f7f5f1]">
      <div className="site-container py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
          <div>
            <div className="h-3 w-32 animate-pulse rounded-full bg-black/5" />
            <div className="mt-5 h-16 w-[34rem] max-w-full animate-pulse rounded-xl bg-black/5" />
            <div className="mt-5 h-5 w-[30rem] max-w-full animate-pulse rounded-full bg-black/5" />

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-black/5"
                />
              ))}
            </div>
          </div>

          <div className="h-[29rem] animate-pulse rounded-[1.75rem] bg-black/5" />
        </div>
      </div>
    </div>
  )
}
