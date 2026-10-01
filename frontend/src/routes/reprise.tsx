import { createFileRoute } from '@tanstack/react-router'
import {
  Bike,
  Camera,
  Check,
  ImagePlus,
  LoaderCircle,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { PublicPage } from '@/components/layout/public-page'
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

  const photoPreviews = useMemo(
    () =>
      selectedPhotos.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedPhotos],
  )

  useEffect(() => {
    return () => {
      for (const preview of photoPreviews) {
        URL.revokeObjectURL(preview.url)
      }
    }
  }, [photoPreviews])

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    const remainingSlots = MAX_TRADE_IN_PHOTOS - selectedPhotos.length

    setPhotoSelectionError(null)

    if (remainingSlots <= 0) {
      event.currentTarget.value = ''
      setPhotoSelectionError(
        `Vous avez déjà sélectionné le maximum de ${MAX_TRADE_IN_PHOTOS} photos.`,
      )
      return
    }

    if (files.length > remainingSlots) {
      event.currentTarget.value = ''
      setPhotoSelectionError(
        `Vous pouvez encore ajouter ${remainingSlots} photo${remainingSlots > 1 ? 's' : ''}.`,
      )
      return
    }

    const unsupported = files.find(
      (file) =>
        file.type !== '' && !ACCEPTED_TRADE_IN_PHOTO_TYPES.has(file.type),
    )

    if (unsupported) {
      event.currentTarget.value = ''
      setPhotoSelectionError('Formats acceptés : JPEG, PNG ou WebP uniquement.')
      return
    }

    const oversized = files.find((file) => file.size > MAX_TRADE_IN_PHOTO_BYTES)

    if (oversized) {
      event.currentTarget.value = ''
      setPhotoSelectionError('Chaque photo doit peser au maximum 10 Mo.')
      return
    }

    setSelectedPhotos((current) => [...current, ...files])
    event.currentTarget.value = ''
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
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
            Reprise
          </p>

          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.2rem,6vw,5.8rem)] font-normal leading-[0.94] tracking-[-0.055em] text-[#171717]">
                Vendez-nous votre vélo.
              </h1>
            </div>

            <p className="max-w-md text-base font-light leading-relaxed text-muted-foreground">
              Donnez-nous simplement les informations que vous connaissez. Nous
              examinerons ensuite votre demande et pourrons vous recontacter
              avec les coordonnées fournies.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          {tradeIn ? (
            <TradeInSuccess
              tradeIn={tradeIn}
              submissionWarning={submissionWarning}
              onReset={() => {
                setTradeIn(null)
                setSelectedPhotos([])
                setPhotoSelectionError(null)
                setSubmissionWarning(null)
                setSubmitError(null)
                setFieldErrors({})
              }}
            />
          ) : (
            <form
              className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem]"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <fieldset disabled={isSubmitting}>
                  <section>
                    <SectionHeading
                      number="01"
                      title="Vos coordonnées"
                      description="Nous en avons besoin pour pouvoir vous recontacter au sujet de votre demande."
                    />

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <TextField
                        label="Prénom"
                        name="firstName"
                        autoComplete="given-name"
                        required
                        error={fieldErrors.firstName}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />

                      <TextField
                        label="Nom"
                        name="lastName"
                        autoComplete="family-name"
                        required
                        error={fieldErrors.lastName}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />

                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        error={fieldErrors.email}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />

                      <TextField
                        label="Téléphone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        error={fieldErrors.phone}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />
                    </div>
                  </section>

                  <section className="mt-12 border-t border-black/10 pt-12">
                    <SectionHeading
                      number="02"
                      title="Votre vélo"
                      description="Marque, modèle, année et prix souhaité sont facultatifs. Remplissez uniquement ce que vous connaissez."
                    />

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <TextField
                        label="Marque"
                        name="brand"
                        placeholder="Ex. Trek"
                        error={fieldErrors.brand}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />

                      <TextField
                        label="Modèle"
                        name="model"
                        placeholder="Ex. Domane AL 4"
                        error={fieldErrors.model}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />

                      <TextField
                        label="Année"
                        name="year"
                        inputMode="numeric"
                        placeholder="Ex. 2022"
                        error={fieldErrors.year}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />

                      <TextField
                        label="Prix souhaité"
                        name="desiredPrice"
                        inputMode="decimal"
                        placeholder="Ex. 850"
                        hint="Montant en euros."
                        error={fieldErrors.desiredPrice}
                        className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                      />
                    </div>

                    <label className="mt-5 block">
                      <span className="mb-2 block text-sm font-medium text-[#171717]">
                        Description
                      </span>

                      <textarea
                        name="description"
                        rows={5}
                        placeholder="État général, entretien, équipements, défauts éventuels…"
                        className={`${fieldControlClassName} resize-y rounded-xl border-black/10 bg-[#f7f5f1] px-4 py-3`}
                        aria-invalid={
                          fieldErrors.description ? true : undefined
                        }
                      />

                      <p className="mt-2 text-xs text-muted-foreground">
                        Facultatif — ajoutez ce qui peut nous aider à comprendre
                        l’état du vélo.
                      </p>

                      {fieldErrors.description ? (
                        <p className="mt-2 text-sm text-red-700">
                          {fieldErrors.description}
                        </p>
                      ) : null}
                    </label>
                  </section>
                </fieldset>

                <section className="mt-12 border-t border-black/10 pt-12">
                  <SectionHeading
                    number="03"
                    title="Photos"
                    description="Quelques photos permettent de mieux comprendre l’état général du vélo."
                  />

                  <div className="mt-7">
                    <label
                      htmlFor={
                        selectedPhotos.length >= MAX_TRADE_IN_PHOTOS
                          ? undefined
                          : 'trade-in-photos'
                      }
                      className={[
                        'group flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-6 py-10 text-center transition-colors',
                        selectedPhotos.length >= MAX_TRADE_IN_PHOTOS
                          ? 'cursor-not-allowed border-black/10 bg-[#f7f5f1] opacity-70'
                          : 'cursor-pointer border-black/20 bg-[#f7f5f1] hover:border-[#b44a42]/50 hover:bg-[#f3f0eb]',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex size-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5',
                          selectedPhotos.length >= MAX_TRADE_IN_PHOTOS
                            ? 'text-muted-foreground'
                            : 'text-[#b44a42]',
                        ].join(' ')}
                      >
                        {selectedPhotos.length >= MAX_TRADE_IN_PHOTOS ? (
                          <Check aria-hidden="true" className="size-5" />
                        ) : (
                          <ImagePlus aria-hidden="true" className="size-5" />
                        )}
                      </span>

                      <span className="mt-5 text-sm font-medium text-[#171717]">
                        {selectedPhotos.length >= MAX_TRADE_IN_PHOTOS
                          ? 'Maximum de 5 photos atteint'
                          : 'Ajouter des photos'}
                      </span>

                      <span className="mt-2 max-w-md text-xs font-light leading-relaxed text-muted-foreground">
                        {selectedPhotos.length >= MAX_TRADE_IN_PHOTOS
                          ? 'Supprimez une photo pour pouvoir en ajouter une autre.'
                          : 'Jusqu’à 5 photos · JPEG, PNG ou WebP · 10 Mo maximum par photo'}
                      </span>

                      <input
                        id="trade-in-photos"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        disabled={
                          isSubmitting ||
                          selectedPhotos.length >= MAX_TRADE_IN_PHOTOS
                        }
                        className="sr-only"
                        onChange={handlePhotoSelection}
                      />
                    </label>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        {selectedPhotos.length} / {MAX_TRADE_IN_PHOTOS} photo
                        {selectedPhotos.length > 1 ? 's' : ''} sélectionnée
                        {selectedPhotos.length > 1 ? 's' : ''}
                      </p>

                      {selectedPhotos.length > 0 ? (
                        <p className="text-xs font-medium text-emerald-700">
                          Prêtes à être envoyées
                        </p>
                      ) : null}
                    </div>

                    {photoPreviews.length > 0 ? (
                      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {photoPreviews.map((preview, index) => (
                          <div
                            key={`${preview.file.name}-${preview.file.size}-${preview.file.lastModified}-${index}`}
                            className="group relative overflow-hidden rounded-[1.25rem] bg-[#f7f5f1] ring-1 ring-black/5"
                          >
                            <div className="aspect-[4/3]">
                              <img
                                src={preview.url}
                                alt={`Photo sélectionnée ${index + 1}`}
                                className="size-full object-cover"
                              />
                            </div>

                            <button
                              type="button"
                              aria-label={`Retirer la photo ${index + 1}`}
                              disabled={isSubmitting}
                              onClick={() => removeSelectedPhoto(index)}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-[#171717] shadow-sm transition-colors hover:bg-[#171717] hover:text-white disabled:opacity-50"
                            >
                              <X aria-hidden="true" className="size-4" />
                            </button>

                            <div className="px-3 py-2.5">
                              <p className="truncate text-xs font-medium text-[#171717]">
                                {preview.file.name}
                              </p>
                              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                                {(preview.file.size / (1024 * 1024)).toFixed(1)}{' '}
                                Mo
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {photoSelectionError ? (
                      <div
                        role="alert"
                        className="mt-5 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-800 ring-1 ring-red-100"
                      >
                        {photoSelectionError}
                      </div>
                    ) : null}
                  </div>
                </section>

                {submitError ? (
                  <div
                    role="alert"
                    className="mt-7 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-800 ring-1 ring-red-100"
                  >
                    {submitError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#b44a42] px-8 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#9d4039] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
                    <>
                      Envoyer ma demande
                      <Send
                        aria-hidden="true"
                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>

              <aside className="h-fit lg:sticky lg:top-8">
                <div className="rounded-[1.75rem] bg-[#f7f5f1] p-6 ring-1 ring-black/5 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                    Comment ça marche
                  </p>

                  <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
                    Une demande simple.
                  </h2>

                  <div className="mt-7 space-y-6">
                    <ProcessStep
                      icon={<Bike aria-hidden="true" className="size-5" />}
                      number="01"
                      title="Décrivez le vélo"
                      text="Indiquez ce que vous connaissez. Les informations techniques ne sont pas obligatoires."
                    />

                    <ProcessStep
                      icon={<Camera aria-hidden="true" className="size-5" />}
                      number="02"
                      title="Ajoutez des photos"
                      text="Elles sont facultatives, mais elles facilitent l’examen de votre demande."
                    />

                    <ProcessStep
                      icon={
                        <ShieldCheck aria-hidden="true" className="size-5" />
                      }
                      number="03"
                      title="Nous examinons la demande"
                      text="Flo’s Bikes pourra ensuite vous recontacter avec les coordonnées renseignées."
                    />
                  </div>

                  <div className="mt-7 border-t border-black/10 pt-6">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
                        <Check aria-hidden="true" className="size-3.5" />
                      </span>

                      <p className="text-xs font-light leading-relaxed text-muted-foreground">
                        Vous pouvez envoyer la demande même si vous ne
                        connaissez ni le modèle exact, ni l’année, ni le prix
                        souhaité.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </form>
          )}
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

function ProcessStep({
  icon,
  number,
  title,
  text,
}: {
  icon: React.ReactNode
  number: string
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
        {icon}
      </span>

      <div>
        <p className="text-[0.65rem] font-medium tracking-[0.14em] text-muted-foreground">
          {number}
        </p>

        <p className="mt-1 text-sm font-medium text-[#171717]">{title}</p>

        <p className="mt-1.5 text-xs font-light leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}

function TradeInSuccess({
  tradeIn,
  submissionWarning,
  onReset,
}: {
  tradeIn: CreatedTradeIn
  submissionWarning: string | null
  onReset: () => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[2rem] bg-[#f7f5f1] px-6 py-14 text-center ring-1 ring-black/5 sm:px-12 sm:py-16">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Check aria-hidden="true" className="size-6" />
        </span>

        <p className="mt-7 text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
          Demande envoyée
        </p>

        <h1 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717] sm:text-5xl">
          Nous avons bien reçu votre vélo.
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
          Votre demande de reprise n°{tradeIn.id} est enregistrée. Flo’s Bikes
          peut maintenant l’examiner et vous recontacter avec les coordonnées
          fournies.
        </p>

        <button
          type="button"
          onClick={onReset}
          className="mt-8 inline-flex min-h-13 items-center justify-center rounded-full border border-black/15 bg-white px-7 text-sm font-medium text-[#171717] transition-colors hover:border-black/30"
        >
          Envoyer une autre demande
        </button>
      </div>

      {submissionWarning ? (
        <div
          role="alert"
          className="mt-5 rounded-xl bg-amber-50 px-4 py-3.5 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-100"
        >
          {submissionWarning}
        </div>
      ) : null}
    </div>
  )
}
