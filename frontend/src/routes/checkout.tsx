import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { PublicPage } from '@/components/layout/public-page'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { useCart } from '@/features/cart/cart-context'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

type FulfillmentMethod = 'pickup' | 'delivery'

type RevalidatedCartItem = {
  productId: string
  quantity: 1
  available: boolean
  brand: string | null
  model: string | null
  priceCents: string | null
}

type RevalidatedCart = {
  items: RevalidatedCartItem[]
  totalCents: string
  isValid: boolean
}

type PublicSiteSettings = {
  phone: string | null
  email: string | null
  address: string | null
  deliveryFeeCents: string
}

type CreatedDraftOrder = {
  id: string
  status: 'pending_payment'
  paymentStatus: 'pending'
  subtotalCents: string
  deliveryFeeCents: string
  totalCents: string
  currency: 'EUR'
  items: Array<{
    productId: string
    productName: string
    unitPriceCents: string
  }>
}

type FieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'address'
    | 'postalCode'
    | 'city'
    | 'country',
    string
  >
>

function formatPrice(priceCents: string | number) {
  const value = typeof priceCents === 'string' ? Number(priceCents) : priceCents

  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value / 100)
}

function getCheckoutFieldErrors(error: ApiClientError): FieldErrors {
  const fields = error.fields ?? {}

  return {
    firstName: fields['body.checkout.customerFirstName'],
    lastName: fields['body.checkout.customerLastName'],
    email: fields['body.checkout.customerEmail'],
    phone: fields['body.checkout.customerPhone'],
    address: fields['body.checkout.deliveryAddressLine1'],
    postalCode: fields['body.checkout.deliveryPostalCode'],
    city: fields['body.checkout.deliveryCity'],
    country: fields['body.checkout.deliveryCountry'],
  }
}

function CheckoutPage() {
  const { items, isHydrated } = useCart()

  const [cart, setCart] = useState<RevalidatedCart | null>(null)
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null)
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>('pickup')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [order, setOrder] = useState<CreatedDraftOrder | null>(null)

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (items.length === 0) {
      return
    }

    let cancelled = false

    async function loadCheckout() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [validatedCart, publicSettings] = await Promise.all([
          apiRequest<RevalidatedCart>('/cart/revalidate', {
            method: 'POST',
            body: {
              items,
            },
          }),
          apiRequest<PublicSiteSettings>('/site-settings/public'),
        ])

        if (!cancelled) {
          setCart(validatedCart)
          setSettings(publicSettings)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiClientError
              ? error.message
              : 'Impossible de préparer le checkout.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCheckout()

    return () => {
      cancelled = true
    }
  }, [isHydrated, items])

  const deliveryFeeCents =
    fulfillmentMethod === 'delivery'
      ? Number(settings?.deliveryFeeCents ?? 0)
      : 0

  const totalCents = useMemo(() => {
    const subtotal = Number(cart?.totalCents ?? 0)

    return subtotal + deliveryFeeCents
  }, [cart?.totalCents, deliveryFeeCents])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!cart?.isValid || items.length === 0 || isSubmitting) {
      return
    }

    setSubmitError(null)
    setFieldErrors({})
    setOrder(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    const checkout =
      fulfillmentMethod === 'delivery'
        ? {
            customerFirstName: String(formData.get('firstName') ?? ''),
            customerLastName: String(formData.get('lastName') ?? ''),
            customerEmail: String(formData.get('email') ?? ''),
            customerPhone: String(formData.get('phone') ?? ''),
            fulfillmentMethod,
            deliveryAddressLine1: String(formData.get('address') ?? ''),
            deliveryPostalCode: String(formData.get('postalCode') ?? ''),
            deliveryCity: String(formData.get('city') ?? ''),
            deliveryCountry: String(formData.get('country') ?? ''),
          }
        : {
            customerFirstName: String(formData.get('firstName') ?? ''),
            customerLastName: String(formData.get('lastName') ?? ''),
            customerEmail: String(formData.get('email') ?? ''),
            customerPhone: String(formData.get('phone') ?? ''),
            fulfillmentMethod,
          }

    try {
      const createdOrder = await apiRequest<CreatedDraftOrder>('/orders', {
        method: 'POST',
        body: {
          cart: {
            items,
          },
          checkout,
        },
      })

      setOrder(createdOrder)
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message)

        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors(getCheckoutFieldErrors(error))
        }

        if (error.code === 'PRODUCT_NOT_AVAILABLE') {
          try {
            const refreshedCart = await apiRequest<RevalidatedCart>(
              '/cart/revalidate',
              {
                method: 'POST',
                body: {
                  items,
                },
              },
            )

            setCart(refreshedCart)
          } catch {
            // L'erreur principale reste affichée.
          }
        }
      } else {
        setSubmitError('Impossible de préparer la commande.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    isHydrated &&
    !isLoading &&
    cart?.isValid === true &&
    settings !== null &&
    items.length > 0 &&
    !isSubmitting &&
    !order

  return (
    <PublicPage>
      <section className="border-b border-border bg-brand-gray-50">
        <div className="site-container py-10 lg:py-14">
          <a
            href="/panier"
            className="type-secondary inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour au panier
          </a>

          <p className="type-label mt-8 uppercase tracking-[0.16em] text-primary">
            Commande
          </p>

          <h1 className="type-display mt-3">Finaliser votre achat.</h1>

          <p className="type-body mt-4 max-w-2xl text-muted-foreground">
            Aucun compte n’est nécessaire. Les informations saisies servent
            uniquement au traitement de votre commande.
          </p>
        </div>
      </section>

      <section className="site-container section-space">
        {!isHydrated || isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            <p className="type-body">Préparation de votre commande…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border bg-brand-gray-50 p-6">
            <h2 className="text-xl font-medium">Votre panier est vide.</h2>
            <p className="type-secondary mt-2 text-muted-foreground">
              Ajoutez un vélo avant de passer à la commande.
            </p>
            <a
              href="/catalogue"
              className="type-button mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-primary-foreground hover:bg-brand-red-dark"
            >
              Voir les vélos
            </a>
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-xl font-medium">
              Impossible de préparer le checkout.
            </h2>
            <p className="type-secondary mt-2 text-destructive">{loadError}</p>
          </div>
        ) : !cart?.isValid ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-xl font-medium">
              Votre panier doit être vérifié.
            </h2>
            <p className="type-secondary mt-2 text-muted-foreground">
              Un ou plusieurs vélos ne sont plus disponibles. Revenez au panier
              avant de continuer.
            </p>
            <a
              href="/panier"
              className="type-button mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-primary-foreground hover:bg-brand-red-dark"
            >
              Retour au panier
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-10 lg:grid-cols-[1fr_23rem]"
          >
            <div className="space-y-10">
              <fieldset disabled={Boolean(order)}>
                <legend className="type-heading-3">Vos coordonnées</legend>

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
              </fieldset>

              <fieldset
                disabled={Boolean(order)}
                className="border-t border-border pt-10"
              >
                <legend className="type-heading-3">Mode de réception</legend>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Choice
                    name="deliveryMethod"
                    value="pickup"
                    title="Retrait"
                    description="Récupérer la commande directement auprès de Flo’s Bikes."
                    checked={fulfillmentMethod === 'pickup'}
                    onChange={() => setFulfillmentMethod('pickup')}
                  />

                  <Choice
                    name="deliveryMethod"
                    value="delivery"
                    title="Livraison"
                    description={`Livraison : ${formatPrice(
                      settings?.deliveryFeeCents ?? '0',
                    )}.`}
                    checked={fulfillmentMethod === 'delivery'}
                    onChange={() => setFulfillmentMethod('delivery')}
                  />
                </div>
              </fieldset>

              {fulfillmentMethod === 'delivery' ? (
                <fieldset
                  disabled={Boolean(order)}
                  className="border-t border-border pt-10"
                >
                  <legend className="type-heading-3">
                    Adresse de livraison
                  </legend>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <TextField
                        label="Adresse"
                        name="address"
                        autoComplete="street-address"
                        required
                        error={fieldErrors.address}
                      />
                    </div>

                    <TextField
                      label="Code postal"
                      name="postalCode"
                      autoComplete="postal-code"
                      required
                      error={fieldErrors.postalCode}
                    />

                    <TextField
                      label="Ville"
                      name="city"
                      autoComplete="address-level2"
                      required
                      error={fieldErrors.city}
                    />

                    <div className="sm:col-span-2">
                      <TextField
                        label="Pays"
                        name="country"
                        autoComplete="country-name"
                        required
                        error={fieldErrors.country}
                      />
                    </div>
                  </div>
                </fieldset>
              ) : null}

              <div className="border-t border-border pt-10">
                <div className="flex gap-3 rounded-lg bg-brand-gray-50 p-5">
                  <LockKeyhole
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                  />

                  <div>
                    <p className="font-medium">Paiement sécurisé avec Stripe</p>
                    <p className="type-secondary mt-1 text-muted-foreground">
                      Cette étape prépare la commande. Le paiement Stripe sera
                      proposé à l’étape suivante du parcours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="surface-card h-fit p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-medium">Votre commande</h2>

              <div className="mt-6 space-y-5 border-b border-border pb-5">
                {cart.items.map((item) => (
                  <div key={item.productId}>
                    <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                      {item.brand}
                    </p>
                    <div className="mt-1 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.model}</p>
                        <p className="type-secondary mt-1 text-muted-foreground">
                          Quantité : {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.priceCents ?? '0')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <dl className="mt-5 space-y-4">
                <SummaryRow
                  label="Sous-total"
                  value={formatPrice(cart.totalCents)}
                />
                <SummaryRow
                  label={
                    fulfillmentMethod === 'pickup' ? 'Retrait' : 'Livraison'
                  }
                  value={
                    fulfillmentMethod === 'pickup'
                      ? 'Gratuit'
                      : formatPrice(deliveryFeeCents)
                  }
                />

                <div className="border-t border-border pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatPrice(totalCents)}
                    strong
                  />
                </div>
              </dl>

              {submitError ? (
                <p className="type-secondary mt-5 text-destructive">
                  {submitError}
                </p>
              ) : null}

              {order ? (
                <div className="mt-6 rounded-lg bg-brand-gray-50 p-5">
                  <div className="flex gap-3">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <div>
                      <p className="font-medium">Commande préparée</p>
                      <p className="type-secondary mt-1 text-muted-foreground">
                        Commande n°{order.id} · Total serveur{' '}
                        {formatPrice(order.totalCents)}.
                      </p>
                      <p className="type-secondary mt-2 text-muted-foreground">
                        Aucun paiement n’a encore été effectué.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  className="mt-6 w-full"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Préparation…
                    </>
                  ) : (
                    'Préparer la commande'
                  )}
                </Button>
              )}

              <p className="type-secondary mt-4 text-muted-foreground">
                Prix, disponibilité et frais sont revérifiés côté serveur lors
                de la création de la commande.
              </p>
            </aside>
          </form>
        )}
      </section>
    </PublicPage>
  )
}

function Choice({
  name,
  value,
  title,
  description,
  checked,
  onChange,
}: {
  name: string
  value: FulfillmentMethod
  title: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="surface-card flex cursor-pointer gap-3 p-5">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-brand-red"
      />

      <span>
        <span className="block font-medium">{title}</span>
        <span className="type-secondary mt-1 block text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  )
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt
        className={
          strong ? 'font-medium' : 'type-secondary text-muted-foreground'
        }
      >
        {label}
      </dt>
      <dd className={strong ? 'text-xl font-medium' : 'font-medium'}>
        {value}
      </dd>
    </div>
  )
}
