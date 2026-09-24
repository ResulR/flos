import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/parametres')({
  component: AdminSettingsPage,
})

type AdminSiteSettings = {
  phone: string | null
  email: string | null
  address: string | null
  deliveryFeeCents: string
}

type FieldErrors = Partial<
  Record<'phone' | 'email' | 'address' | 'deliveryFee', string>
>

function priceCentsToInput(value: string) {
  const cents = Number(value)

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return ''
  }

  return (cents / 100).toFixed(2).replace('.', ',')
}

function parseDeliveryFee(value: string) {
  const trimmed = value.trim()

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) {
    return { error: 'Frais de livraison invalides' }
  }

  const cents = Math.round(Number(trimmed.replace(',', '.')) * 100)

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return { error: 'Frais de livraison invalides' }
  }

  return { value: cents }
}

function nullableText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function getFieldErrors(error: ApiClientError): FieldErrors {
  const fields = error.fields ?? {}

  return {
    phone: fields['body.phone'],
    email: fields['body.email'],
    address: fields['body.address'],
    deliveryFee: fields['body.deliveryFeeCents'],
  }
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  )
  const [loadAttempt, setLoadAttempt] = useState(0)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      setLoadState('loading')
      setSubmitError(null)
      setSuccessMessage(null)

      try {
        const loadedSettings = await apiRequest<AdminSiteSettings>(
          '/admin/site-settings',
        )

        if (cancelled) {
          return
        }

        setSettings(loadedSettings)
        setPhone(loadedSettings.phone ?? '')
        setEmail(loadedSettings.email ?? '')
        setAddress(loadedSettings.address ?? '')
        setDeliveryFee(priceCentsToInput(loadedSettings.deliveryFeeCents))
        setLoadState('ready')
      } catch {
        if (!cancelled) {
          setSettings(null)
          setLoadState('error')
        }
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!settings || isSubmitting) {
      return
    }

    setSubmitError(null)
    setSuccessMessage(null)
    setFieldErrors({})

    const parsedDeliveryFee = parseDeliveryFee(deliveryFee)

    if (parsedDeliveryFee.error || parsedDeliveryFee.value === undefined) {
      setFieldErrors({
        deliveryFee: parsedDeliveryFee.error ?? 'Frais de livraison invalides',
      })
      setSubmitError('Vérifiez les informations du formulaire.')
      return
    }

    setIsSubmitting(true)

    try {
      const updated = await apiRequest<AdminSiteSettings>(
        '/admin/site-settings',
        {
          method: 'PATCH',
          body: {
            phone: nullableText(phone),
            email: nullableText(email),
            address: nullableText(address),
            deliveryFeeCents: parsedDeliveryFee.value,
          },
        },
      )

      setSettings(updated)
      setPhone(updated.phone ?? '')
      setEmail(updated.email ?? '')
      setAddress(updated.address ?? '')
      setDeliveryFee(priceCentsToInput(updated.deliveryFeeCents))
      setSuccessMessage('Les paramètres ont été enregistrés.')
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors(getFieldErrors(error))
          setSubmitError('Vérifiez les informations du formulaire.')
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError('Impossible d’enregistrer les paramètres.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminShell title="Paramètres" eyebrow="Informations commerciales">
      <div className="max-w-3xl">
        <AdminPanel
          title="Coordonnées et livraison"
          description="Ces valeurs alimentent les pages publiques et le checkout."
        >
          {loadState === 'loading' ? (
            <div
              role="status"
              className="flex min-h-64 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Chargement des paramètres…
            </div>
          ) : loadState === 'error' || !settings ? (
            <div className="p-6">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <p className="font-medium">
                  Impossible de charger les paramètres.
                </p>
                <p className="type-secondary mt-2 text-muted-foreground">
                  Vérifiez la connexion au serveur puis réessayez.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLoadAttempt((current) => current + 1)}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-8 p-5 lg:p-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="type-label mb-2 block">Téléphone</span>
                  <input
                    name="phone"
                    type="tel"
                    className="form-control w-full"
                    value={phone}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setPhone(event.target.value)
                      setFieldErrors((current) => ({
                        ...current,
                        phone: undefined,
                      }))
                    }}
                  />
                  {fieldErrors.phone ? (
                    <span className="type-secondary mt-2 block text-destructive">
                      {fieldErrors.phone}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="type-label mb-2 block">Email</span>
                  <input
                    name="email"
                    type="email"
                    className="form-control w-full"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setFieldErrors((current) => ({
                        ...current,
                        email: undefined,
                      }))
                    }}
                  />
                  {fieldErrors.email ? (
                    <span className="type-secondary mt-2 block text-destructive">
                      {fieldErrors.email}
                    </span>
                  ) : null}
                </label>

                <label className="block sm:col-span-2">
                  <span className="type-label mb-2 block">Adresse</span>
                  <input
                    name="address"
                    type="text"
                    className="form-control w-full"
                    value={address}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setAddress(event.target.value)
                      setFieldErrors((current) => ({
                        ...current,
                        address: undefined,
                      }))
                    }}
                  />
                  {fieldErrors.address ? (
                    <span className="type-secondary mt-2 block text-destructive">
                      {fieldErrors.address}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="type-label mb-2 block">
                    Frais de livraison
                  </span>
                  <input
                    name="deliveryFee"
                    type="text"
                    inputMode="decimal"
                    className="form-control w-full"
                    value={deliveryFee}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setDeliveryFee(event.target.value)
                      setFieldErrors((current) => ({
                        ...current,
                        deliveryFee: undefined,
                      }))
                    }}
                  />
                  <span className="type-secondary mt-2 block text-muted-foreground">
                    Montant en euros.
                  </span>
                  {fieldErrors.deliveryFee ? (
                    <span className="type-secondary mt-2 block text-destructive">
                      {fieldErrors.deliveryFee}
                    </span>
                  ) : null}
                </label>
              </div>

              {successMessage ? (
                <div role="status" className="flex items-center gap-2 text-sm">
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                  {successMessage}
                </div>
              ) : null}

              {submitError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {submitError}
                </div>
              ) : null}

              <div className="flex justify-end border-t border-border pt-6">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
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
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
