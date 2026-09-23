import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus, LoaderCircle } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { FlowState } from '@/components/feedback/flow-state'
import { PublicPage } from '@/components/layout/public-page'
import { Button } from '@/components/ui/button'
import { TextField, fieldControlClassName } from '@/components/ui/field'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/reprise')({
  component: TradeInPage,
})

type CreatedTradeIn = {
  id: string
  status: 'pending'
  createdAt: string
}

type TradeInFieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'brand'
    | 'model'
    | 'year'
    | 'desiredPrice'
    | 'description',
    string
  >
>

function getTradeInFieldErrors(error: ApiClientError): TradeInFieldErrors {
  const fields = error.fields ?? {}

  return {
    firstName: fields['body.firstName'],
    lastName: fields['body.lastName'],
    email: fields['body.email'],
    phone: fields['body.phone'],
    brand: fields['body.brand'],
    model: fields['body.model'],
    year: fields['body.year'],
    desiredPrice: fields['body.desiredPriceCents'],
    description: fields['body.description'],
  }
}

function parseOptionalYear(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return { value: undefined }
  }

  if (!/^\d+$/.test(trimmed)) {
    return { error: 'Année invalide' }
  }

  const year = Number(trimmed)

  if (!Number.isSafeInteger(year)) {
    return { error: 'Année invalide' }
  }

  return { value: year }
}

function parseOptionalDesiredPrice(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return { value: undefined }
  }

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) {
    return { error: 'Prix souhaité invalide' }
  }

  const normalized = trimmed.replace(',', '.')
  const cents = Math.round(Number(normalized) * 100)

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return { error: 'Prix souhaité invalide' }
  }

  return { value: cents }
}

function TradeInPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<TradeInFieldErrors>({})
  const [tradeIn, setTradeIn] = useState<CreatedTradeIn | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setSubmitError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)

    const firstName = String(formData.get('firstName') ?? '')
    const lastName = String(formData.get('lastName') ?? '')
    const email = String(formData.get('email') ?? '')
    const phone = String(formData.get('phone') ?? '')
    const brand = String(formData.get('brand') ?? '').trim()
    const model = String(formData.get('model') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()

    const parsedYear = parseOptionalYear(String(formData.get('year') ?? ''))
    const parsedDesiredPrice = parseOptionalDesiredPrice(
      String(formData.get('desiredPrice') ?? ''),
    )

    const localErrors: TradeInFieldErrors = {
      ...(parsedYear.error ? { year: parsedYear.error } : {}),
      ...(parsedDesiredPrice.error
        ? { desiredPrice: parsedDesiredPrice.error }
        : {}),
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      setSubmitError('Vérifiez les informations du formulaire.')
      return
    }

    const body = {
      firstName,
      lastName,
      email,
      phone,
      ...(brand ? { brand } : {}),
      ...(model ? { model } : {}),
      ...(parsedYear.value !== undefined ? { year: parsedYear.value } : {}),
      ...(parsedDesiredPrice.value !== undefined
        ? { desiredPriceCents: parsedDesiredPrice.value }
        : {}),
      ...(description ? { description } : {}),
    }

    setIsSubmitting(true)

    try {
      const createdTradeIn = await apiRequest<CreatedTradeIn>('/trade-ins', {
        method: 'POST',
        body,
      })

      setTradeIn(createdTradeIn)
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors(getTradeInFieldErrors(error))
          setSubmitError('Vérifiez les informations du formulaire.')
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError('Impossible d’envoyer votre demande de reprise.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PublicPage>
      <section className="overflow-hidden bg-brand-red text-brand-white">
        <div className="site-container py-14 lg:py-20">
          <p className="type-label uppercase tracking-[0.16em] text-brand-white/70">
            Reprise
          </p>

          <h1 className="type-display mt-3 max-w-3xl">
            Vous avez un vélo à vendre ?
          </h1>

          <p className="type-body mt-5 max-w-2xl text-brand-white/80">
            Envoyez ce que vous connaissez. La marque, le modèle ou l’année
            peuvent être laissés vides si vous ne les connaissez pas.
          </p>
        </div>
      </section>

      <section className="site-container section-space">
        {tradeIn ? (
          <div className="mx-auto max-w-4xl">
            <FlowState
              kind="success"
              title="Votre demande a bien été envoyée"
              description="Flo’s Bikes pourra maintenant examiner votre demande de reprise et vous recontacter avec les coordonnées fournies."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTradeIn(null)}
                >
                  Envoyer une autre demande
                </Button>
              }
            />
          </div>
        ) : (
          <form
            className="mx-auto max-w-4xl"
            onSubmit={handleSubmit}
            noValidate
          >
            <fieldset disabled={isSubmitting}>
              <section>
                <h2 className="type-heading-3">Vos coordonnées</h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Prénom"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    error={fieldErrors.firstName}
                  />
                  <TextField
                    label="Nom"
                    name="lastName"
                    autoComplete="family-name"
                    required
                    error={fieldErrors.lastName}
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    error={fieldErrors.email}
                  />
                  <TextField
                    label="Téléphone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    error={fieldErrors.phone}
                  />
                </div>
              </section>

              <section className="mt-10 border-t border-border pt-10">
                <h2 className="type-heading-3">Le vélo</h2>

                <p className="type-secondary mt-3 text-muted-foreground">
                  Ces informations sont facultatives. Remplissez uniquement ce
                  que vous connaissez.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Marque — facultatif"
                    name="brand"
                    error={fieldErrors.brand}
                  />
                  <TextField
                    label="Modèle — facultatif"
                    name="model"
                    error={fieldErrors.model}
                  />
                  <TextField
                    label="Année — facultatif"
                    name="year"
                    inputMode="numeric"
                    error={fieldErrors.year}
                  />
                  <TextField
                    label="Prix souhaité — facultatif"
                    name="desiredPrice"
                    inputMode="decimal"
                    placeholder="Ex. 850"
                    hint="Montant en euros."
                    error={fieldErrors.desiredPrice}
                  />
                </div>

                <label className="mt-5 block">
                  <span className="type-label mb-2 block">
                    Description — facultatif
                  </span>
                  <textarea
                    name="description"
                    rows={5}
                    className={fieldControlClassName}
                    aria-invalid={fieldErrors.description ? true : undefined}
                  />
                  {fieldErrors.description ? (
                    <p className="type-secondary mt-2 text-destructive">
                      {fieldErrors.description}
                    </p>
                  ) : null}
                </label>
              </section>
            </fieldset>

            <section className="mt-10 border-t border-border pt-10">
              <h2 className="type-heading-3">Photos</h2>

              <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-brand-gray-400 bg-brand-gray-50 p-8 text-center">
                <ImagePlus
                  aria-hidden="true"
                  className="size-7 text-muted-foreground"
                />

                <span className="mt-4 font-medium">
                  Ajout de photos bientôt disponible
                </span>

                <span className="type-secondary mt-2 max-w-md text-muted-foreground">
                  Vous pouvez déjà envoyer votre demande sans photo. Elles
                  seront prises en charge dans une prochaine étape.
                </span>
              </div>
            </section>

            {submitError ? (
              <p
                role="alert"
                className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {submitError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-10"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Envoi en cours…
                </>
              ) : (
                'Envoyer ma demande'
              )}
            </Button>
          </form>
        )}
      </section>
    </PublicPage>
  )
}
