import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus, LoaderCircle } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useState } from 'react'

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

type CreatedTradeInResponse = CreatedTradeIn & {
  uploadToken: string
}

const MAX_TRADE_IN_PHOTOS = 5
const MAX_TRADE_IN_PHOTO_BYTES = 10 * 1024 * 1024
const ACCEPTED_TRADE_IN_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

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
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoSelectionError, setPhotoSelectionError] = useState<string | null>(
    null,
  )
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(
    null,
  )

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])

    setPhotoSelectionError(null)

    if (files.length > MAX_TRADE_IN_PHOTOS) {
      setSelectedPhotos([])
      event.currentTarget.value = ''
      setPhotoSelectionError(
        `Vous pouvez joindre au maximum ${MAX_TRADE_IN_PHOTOS} photos.`,
      )
      return
    }

    const unsupported = files.find(
      (file) =>
        file.type !== '' && !ACCEPTED_TRADE_IN_PHOTO_TYPES.has(file.type),
    )

    if (unsupported) {
      setSelectedPhotos([])
      event.currentTarget.value = ''
      setPhotoSelectionError('Formats acceptés : JPEG, PNG ou WebP uniquement.')
      return
    }

    const oversized = files.find((file) => file.size > MAX_TRADE_IN_PHOTO_BYTES)

    if (oversized) {
      setSelectedPhotos([])
      event.currentTarget.value = ''
      setPhotoSelectionError('Chaque photo doit peser au maximum 10 Mo.')
      return
    }

    setSelectedPhotos(files)
  }

  function removeSelectedPhoto(index: number) {
    setSelectedPhotos((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    )
    setPhotoSelectionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setSubmitError(null)
    setFieldErrors({})
    setSubmissionWarning(null)

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
      const createdTradeIn = await apiRequest<CreatedTradeInResponse>(
        '/trade-ins',
        {
          method: 'POST',
          body,
        },
      )

      const submittedTradeIn: CreatedTradeIn = {
        id: createdTradeIn.id,
        status: createdTradeIn.status,
        createdAt: createdTradeIn.createdAt,
      }

      let uploadedPhotoCount = 0

      try {
        for (const file of selectedPhotos) {
          await apiRequest<{
            id: string
            displayOrder: number
          }>(`/trade-ins/${createdTradeIn.id}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'X-Trade-In-Upload-Token': createdTradeIn.uploadToken,
            },
            body: file,
          })

          uploadedPhotoCount += 1
        }

        setSelectedPhotos([])
        setTradeIn(submittedTradeIn)
      } catch (uploadError) {
        setTradeIn(submittedTradeIn)

        const failedPhotoCount = selectedPhotos.length - uploadedPhotoCount

        if (uploadError instanceof ApiClientError) {
          setSubmissionWarning(
            `Votre demande a bien été enregistrée, mais ${failedPhotoCount} photo${failedPhotoCount > 1 ? 's n’ont' : ' n’a'} pas pu être envoyée${failedPhotoCount > 1 ? 's' : ''}. ${uploadError.message}`,
          )
        } else {
          setSubmissionWarning(
            `Votre demande a bien été enregistrée, mais ${failedPhotoCount} photo${failedPhotoCount > 1 ? 's n’ont' : ' n’a'} pas pu être envoyée${failedPhotoCount > 1 ? 's' : ''}.`,
          )
        }
      }
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
                  onClick={() => {
                    setTradeIn(null)
                    setSelectedPhotos([])
                    setPhotoSelectionError(null)
                    setSubmissionWarning(null)
                    setSubmitError(null)
                    setFieldErrors({})
                  }}
                >
                  Envoyer une autre demande
                </Button>
              }
            />

            {submissionWarning ? (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
              >
                {submissionWarning}
              </p>
            ) : null}
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

              <p className="type-secondary mt-3 text-muted-foreground">
                Ajoutez jusqu’à 5 photos du vélo pour faciliter son estimation.
                Formats JPEG, PNG ou WebP, 10 Mo maximum par photo.
              </p>

              <div className="mt-6 rounded-xl border border-dashed border-brand-gray-400 bg-brand-gray-50 p-6">
                <div className="flex items-start gap-3">
                  <ImagePlus
                    aria-hidden="true"
                    className="mt-0.5 size-6 shrink-0 text-muted-foreground"
                  />

                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="trade-in-photos"
                      className="type-label block"
                    >
                      Ajouter des photos — facultatif
                    </label>

                    <input
                      id="trade-in-photos"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isSubmitting}
                      className="mt-3 block w-full text-sm"
                      onChange={handlePhotoSelection}
                    />

                    <p className="type-secondary mt-2 text-muted-foreground">
                      {selectedPhotos.length} / {MAX_TRADE_IN_PHOTOS} photo
                      {selectedPhotos.length > 1 ? 's' : ''} sélectionnée
                      {selectedPhotos.length > 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>

                {selectedPhotos.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    {selectedPhotos.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(1)} Mo
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => removeSelectedPhoto(index)}
                        >
                          Retirer
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {photoSelectionError ? (
                  <p role="alert" className="mt-4 text-sm text-destructive">
                    {photoSelectionError}
                  </p>
                ) : null}
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
