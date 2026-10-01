import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Truck,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { PublicPage } from '@/components/layout/public-page'
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
  trackingToken: string
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
  const { items, isHydrated, clearCart } = useCart()

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
    if (!isHydrated || items.length === 0) {
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
              : 'Impossible de préparer votre commande.',
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
      clearCart()
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
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-10 sm:py-12 lg:py-14">
          <a
            href="/panier"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#171717]"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
            />
            Retour au panier
          </a>

          <div className="mt-9">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
              Commande
            </p>

            <h1 className="mt-4 max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3rem,5.5vw,5.2rem)] font-normal leading-[0.95] tracking-[-0.055em] text-[#171717]">
              Finaliser votre commande.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
              Aucun compte n’est nécessaire. Renseignez vos coordonnées puis
              choisissez comment vous souhaitez recevoir votre vélo.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          {!isHydrated || isLoading ? (
            <CheckoutSkeleton />
          ) : order ? (
            <OrderSuccess order={order} />
          ) : items.length === 0 ? (
            <StateCard
              title="Votre panier est vide."
              text="Ajoutez un vélo avant de passer à la commande."
              href="/catalogue"
              action="Voir les vélos"
            />
          ) : loadError ? (
            <StateCard
              title="Impossible de préparer la commande."
              text={loadError}
              href="/panier"
              action="Retour au panier"
              tone="error"
            />
          ) : !cart?.isValid ? (
            <StateCard
              title="Votre panier doit être vérifié."
              text="Un ou plusieurs vélos ne sont plus disponibles. Revenez au panier avant de continuer."
              href="/panier"
              action="Vérifier le panier"
              tone="error"
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem]"
            >
              <div className="space-y-14">
                <section>
                  <SectionHeading
                    number="01"
                    title="Vos coordonnées"
                    description="Ces informations servent uniquement au traitement de votre commande."
                  />

                  <fieldset className="mt-7">
                    <div className="grid gap-5 sm:grid-cols-2">
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
                  </fieldset>
                </section>

                <section className="border-t border-black/10 pt-12">
                  <SectionHeading
                    number="02"
                    title="Mode de réception"
                    description="Choisissez entre le retrait et la livraison."
                  />

                  <fieldset className="mt-7">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Choice
                        name="deliveryMethod"
                        value="pickup"
                        title="Retrait"
                        description={
                          settings?.address
                            ? `Retrait à ${settings.address}.`
                            : 'Récupérer votre vélo directement auprès de Flo’s Bikes.'
                        }
                        checked={fulfillmentMethod === 'pickup'}
                        onChange={() => setFulfillmentMethod('pickup')}
                        icon={<MapPin aria-hidden="true" className="size-5" />}
                      />

                      <Choice
                        name="deliveryMethod"
                        value="delivery"
                        title="Livraison"
                        description={`${formatPrice(
                          settings?.deliveryFeeCents ?? '0',
                        )} de frais de livraison.`}
                        checked={fulfillmentMethod === 'delivery'}
                        onChange={() => setFulfillmentMethod('delivery')}
                        icon={<Truck aria-hidden="true" className="size-5" />}
                      />
                    </div>
                  </fieldset>
                </section>

                {fulfillmentMethod === 'delivery' ? (
                  <section className="border-t border-black/10 pt-12">
                    <SectionHeading
                      number="03"
                      title="Adresse de livraison"
                      description="Indiquez l’adresse à laquelle votre commande doit être envoyée."
                    />

                    <fieldset className="mt-7">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <TextField
                            label="Adresse"
                            name="address"
                            autoComplete="street-address"
                            required
                            error={fieldErrors.address}
                            className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                          />
                        </div>

                        <TextField
                          label="Code postal"
                          name="postalCode"
                          autoComplete="postal-code"
                          required
                          error={fieldErrors.postalCode}
                          className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                        />

                        <TextField
                          label="Ville"
                          name="city"
                          autoComplete="address-level2"
                          required
                          error={fieldErrors.city}
                          className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                        />

                        <div className="sm:col-span-2">
                          <TextField
                            label="Pays"
                            name="country"
                            autoComplete="country-name"
                            required
                            error={fieldErrors.country}
                            className="min-h-12 rounded-xl border-black/10 bg-[#f7f5f1] px-4"
                          />
                        </div>
                      </div>
                    </fieldset>
                  </section>
                ) : null}

                <div className="border-t border-black/10 pt-12">
                  <div className="flex gap-4 rounded-[1.5rem] bg-[#f7f5f1] p-5 ring-1 ring-black/5 sm:p-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
                      <LockKeyhole aria-hidden="true" className="size-4" />
                    </span>

                    <div>
                      <p className="text-sm font-medium text-[#171717]">
                        Vos informations restent privées
                      </p>

                      <p className="mt-1.5 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
                        Les coordonnées saisies servent au traitement et au
                        suivi de cette commande.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="h-fit lg:sticky lg:top-8">
                <div className="rounded-[1.75rem] bg-[#f7f5f1] p-6 ring-1 ring-black/5 sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
                    Récapitulatif
                  </p>

                  <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
                    Votre commande
                  </h2>

                  <div className="mt-7 divide-y divide-black/10 border-y border-black/10">
                    {cart.items.map((item) => (
                      <div key={item.productId} className="py-4">
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              {item.brand}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#171717]">
                              {item.model}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-medium text-[#171717]">
                            {formatPrice(item.priceCents ?? '0')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <dl className="mt-6 space-y-4">
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

                    <div className="border-t border-black/10 pt-5">
                      <SummaryRow
                        label="Total"
                        value={formatPrice(totalCents)}
                        strong
                      />
                    </div>
                  </dl>

                  {submitError ? (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">
                      {submitError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="group mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#b44a42] px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#9d4039] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
                      <>
                        Créer la commande
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>

                  <div className="mt-6 flex gap-3 border-t border-black/10 pt-5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
                      <Check aria-hidden="true" className="size-3.5" />
                    </span>

                    <p className="text-xs font-light leading-relaxed text-muted-foreground">
                      Prix, disponibilité et frais sont vérifiés côté serveur
                      lors de la création de la commande.
                    </p>
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

        <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function Choice({
  name,
  value,
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  name: string
  value: FulfillmentMethod
  title: string
  description: string
  checked: boolean
  onChange: () => void
  icon: React.ReactNode
}) {
  return (
    <label
      className={[
        'relative flex cursor-pointer gap-4 rounded-[1.5rem] p-5 ring-1 transition-all sm:p-6',
        checked
          ? 'bg-[#f7f5f1] ring-[#b44a42]'
          : 'bg-white ring-black/10 hover:ring-black/20',
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      <span
        className={[
          'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
          checked
            ? 'bg-[#b44a42] text-white'
            : 'bg-[#f7f5f1] text-muted-foreground',
        ].join(' ')}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-medium text-[#171717]">{title}</span>

          {checked ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-[#b44a42]/10 text-[#b44a42]">
              <Check aria-hidden="true" className="size-3" />
            </span>
          ) : null}
        </span>

        <span className="mt-1.5 block text-sm font-light leading-relaxed text-muted-foreground">
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
          strong
            ? 'text-sm font-medium text-[#171717]'
            : 'text-sm text-muted-foreground'
        }
      >
        {label}
      </dt>

      <dd
        className={
          strong
            ? 'text-2xl font-medium tracking-[-0.03em] text-[#171717]'
            : 'text-sm font-medium text-[#171717]'
        }
      >
        {value}
      </dd>
    </div>
  )
}

function OrderSuccess({ order }: { order: CreatedDraftOrder }) {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] bg-[#f7f5f1] px-6 py-14 text-center ring-1 ring-black/5 sm:px-12 sm:py-16">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <CheckCircle2 aria-hidden="true" className="size-6" />
      </span>

      <p className="mt-7 text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
        Commande créée
      </p>

      <h2 className="mt-3 font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717] sm:text-5xl">
        Votre commande est enregistrée.
      </h2>

      <p className="mx-auto mt-5 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
        Commande n°{order.id} · Montant total {formatPrice(order.totalCents)}.
        Aucun paiement n’a encore été enregistré.
      </p>

      <a
        href={`/commande/${encodeURIComponent(order.trackingToken)}`}
        className="group mt-8 inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#171717] px-7 text-sm font-medium text-white transition-colors hover:bg-black/80"
      >
        <PackageCheck aria-hidden="true" className="size-4" />
        Voir le suivi de commande
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
        />
      </a>
    </div>
  )
}

function StateCard({
  title,
  text,
  href,
  action,
  tone = 'default',
}: {
  title: string
  text: string
  href: string
  action: string
  tone?: 'default' | 'error'
}) {
  return (
    <div
      className={[
        'mx-auto max-w-3xl rounded-[2rem] px-6 py-14 text-center ring-1 sm:px-12',
        tone === 'error'
          ? 'bg-red-50 ring-red-100'
          : 'bg-[#f7f5f1] ring-black/5',
      ].join(' ')}
    >
      <h2 className="font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal tracking-[-0.04em] text-[#171717]">
        {title}
      </h2>

      <p className="mx-auto mt-4 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
        {text}
      </p>

      <a
        href={href}
        className="group mt-8 inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#171717] px-7 text-sm font-medium text-white transition-colors hover:bg-black/80"
      >
        {action}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
        />
      </a>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div
      className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16"
      aria-hidden="true"
    >
      <div className="space-y-14">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index}>
            <div className="h-8 w-52 animate-pulse rounded-full bg-black/5" />
            <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-black/5" />

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div className="h-20 animate-pulse rounded-xl bg-black/5" />
              <div className="h-20 animate-pulse rounded-xl bg-black/5" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-[30rem] animate-pulse rounded-[1.75rem] bg-black/5" />
    </div>
  )
}
