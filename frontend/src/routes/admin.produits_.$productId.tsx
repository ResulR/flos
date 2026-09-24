import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { Field, TextField, fieldControlClassName } from '@/components/ui/field'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/produits_/$productId')({
  component: AdminProductEditPage,
})

type ProductReference = {
  id: string
  name: string
}

type ProductReferences = {
  brands: ProductReference[]
  bikeTypes: ProductReference[]
  conditions: ProductReference[]
}

type ReferenceType = 'brand' | 'bikeType' | 'condition'

type AdminProductStatus = 'available' | 'hidden' | 'reserved' | 'sold'

type AdminProduct = {
  id: string
  brandId: string
  bikeTypeId: string
  conditionId: string
  model: string
  year: number | null
  description: string
  priceCents: string
  status: AdminProductStatus
  isActive: boolean
  specs: Array<{
    id: string
    label: string
    value: string
  }>
  createdAt: string
  updatedAt: string
}

type ProductFieldErrors = Partial<
  Record<
    | 'brandId'
    | 'bikeTypeId'
    | 'conditionId'
    | 'model'
    | 'year'
    | 'description'
    | 'price',
    string
  >
>

type SpecDraft = {
  key: number
  label: string
  value: string
  labelError?: string
  valueError?: string
}

function sortReferences(references: ProductReference[]) {
  return [...references].sort((left, right) =>
    left.name.localeCompare(right.name, 'fr', {
      sensitivity: 'base',
    }),
  )
}

function parseOptionalYear(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return { value: null }
  }

  if (!/^\d+$/.test(trimmed)) {
    return { error: 'Année invalide' }
  }

  const year = Number(trimmed)

  if (!Number.isSafeInteger(year) || year < 0) {
    return { error: 'Année invalide' }
  }

  return { value: year }
}

function parsePrice(value: string) {
  const trimmed = value.trim()

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) {
    return { error: 'Prix invalide' }
  }

  const cents = Math.round(Number(trimmed.replace(',', '.')) * 100)

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return { error: 'Prix invalide' }
  }

  return { value: cents }
}

function priceCentsToInput(priceCents: string) {
  const value = Number(priceCents)

  if (!Number.isSafeInteger(value)) {
    return ''
  }

  return (value / 100).toFixed(2).replace('.', ',')
}

function getProductFieldErrors(error: ApiClientError): ProductFieldErrors {
  const fields = error.fields ?? {}

  return {
    brandId: fields['body.brandId'],
    bikeTypeId: fields['body.bikeTypeId'],
    conditionId: fields['body.conditionId'],
    model: fields['body.model'],
    year: fields['body.year'],
    description: fields['body.description'],
    price: fields['body.priceCents'],
  }
}

function getSpecErrors(error: ApiClientError, specs: SpecDraft[]): SpecDraft[] {
  const fields = error.fields ?? {}

  return specs.map((spec, index) => ({
    ...spec,
    labelError: fields[`body.specs.${index}.label`],
    valueError: fields[`body.specs.${index}.value`],
  }))
}

function statusLabel(status: AdminProductStatus) {
  switch (status) {
    case 'available':
      return 'Disponible'
    case 'hidden':
      return 'Masqué'
    case 'reserved':
      return 'Réservé'
    case 'sold':
      return 'Vendu'
  }
}

function statusTone(status: AdminProductStatus) {
  if (status === 'available') {
    return 'positive' as const
  }

  if (status === 'reserved') {
    return 'warning' as const
  }

  return 'neutral' as const
}

function AdminProductEditPage() {
  const { productId } = Route.useParams()

  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [references, setReferences] = useState<ProductReferences>({
    brands: [],
    bikeTypes: [],
    conditions: [],
  })

  const [loadState, setLoadState] = useState<
    'loading' | 'ready' | 'not-found' | 'error'
  >('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  const [brandId, setBrandId] = useState('')
  const [bikeTypeId, setBikeTypeId] = useState('')
  const [conditionId, setConditionId] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [editableStatus, setEditableStatus] = useState<'available' | 'hidden'>(
    'available',
  )

  const nextSpecKey = useRef(1)
  const [specs, setSpecs] = useState<SpecDraft[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadState('loading')
      setSubmitError(null)
      setSuccessMessage(null)

      try {
        const [loadedProduct, loadedReferences] = await Promise.all([
          apiRequest<AdminProduct>(`/admin/products/${productId}`),
          apiRequest<ProductReferences>('/admin/products/references'),
        ])

        if (cancelled) {
          return
        }

        setProduct(loadedProduct)
        setReferences({
          brands: sortReferences(loadedReferences.brands),
          bikeTypes: sortReferences(loadedReferences.bikeTypes),
          conditions: sortReferences(loadedReferences.conditions),
        })

        setBrandId(loadedProduct.brandId)
        setBikeTypeId(loadedProduct.bikeTypeId)
        setConditionId(loadedProduct.conditionId)
        setModel(loadedProduct.model)
        setYear(loadedProduct.year === null ? '' : String(loadedProduct.year))
        setDescription(loadedProduct.description)
        setPrice(priceCentsToInput(loadedProduct.priceCents))

        if (
          loadedProduct.status === 'available' ||
          loadedProduct.status === 'hidden'
        ) {
          setEditableStatus(loadedProduct.status)
        }

        nextSpecKey.current = loadedProduct.specs.length + 1
        setSpecs(
          loadedProduct.specs.map((spec, index) => ({
            key: index + 1,
            label: spec.label,
            value: spec.value,
          })),
        )

        setLoadState('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        setProduct(null)

        if (error instanceof ApiClientError && error.status === 404) {
          setLoadState('not-found')
        } else {
          setLoadState('error')
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [loadAttempt, productId])

  function addReferenceToState(
    type: ReferenceType,
    reference: ProductReference,
  ) {
    setReferences((current) => {
      const key =
        type === 'brand'
          ? 'brands'
          : type === 'bikeType'
            ? 'bikeTypes'
            : 'conditions'

      const withoutDuplicate = current[key].filter(
        (item) => item.id !== reference.id,
      )

      return {
        ...current,
        [key]: sortReferences([...withoutDuplicate, reference]),
      }
    })

    if (type === 'brand') {
      setBrandId(reference.id)
    } else if (type === 'bikeType') {
      setBikeTypeId(reference.id)
    } else {
      setConditionId(reference.id)
    }
  }

  function addSpec() {
    setSpecs((current) => [
      ...current,
      {
        key: nextSpecKey.current++,
        label: '',
        value: '',
      },
    ])
  }

  function removeSpec(key: number) {
    setSpecs((current) => current.filter((spec) => spec.key !== key))
  }

  function updateSpec(key: number, field: 'label' | 'value', value: string) {
    setSpecs((current) =>
      current.map((spec) =>
        spec.key === key
          ? {
              ...spec,
              [field]: value,
              ...(field === 'label'
                ? { labelError: undefined }
                : { valueError: undefined }),
            }
          : spec,
      ),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!product || isSubmitting) {
      return
    }

    setSubmitError(null)
    setSuccessMessage(null)
    setFieldErrors({})

    const trimmedModel = model.trim()
    const trimmedDescription = description.trim()
    const parsedYear = parseOptionalYear(year)
    const parsedPrice = parsePrice(price)

    const localFieldErrors: ProductFieldErrors = {
      ...(!brandId ? { brandId: 'Marque requise' } : {}),
      ...(!bikeTypeId ? { bikeTypeId: 'Type requis' } : {}),
      ...(!conditionId ? { conditionId: 'État requis' } : {}),
      ...(!trimmedModel ? { model: 'Modèle requis' } : {}),
      ...(parsedYear.error ? { year: parsedYear.error } : {}),
      ...(parsedPrice.error ? { price: parsedPrice.error } : {}),
      ...(!trimmedDescription ? { description: 'Description requise' } : {}),
    }

    const trimmedSpecs = specs.map((spec) => ({
      ...spec,
      label: spec.label.trim(),
      value: spec.value.trim(),
      labelError: undefined,
      valueError: undefined,
    }))

    const labels = new Set<string>()
    let specsInvalid = false

    const validatedSpecs = trimmedSpecs.map((spec) => {
      if (!spec.label && !spec.value) {
        return spec
      }

      let labelError: string | undefined
      let valueError: string | undefined

      if (!spec.label) {
        labelError = 'Libellé requis'
      }

      if (!spec.value) {
        valueError = 'Valeur requise'
      }

      if (spec.label && labels.has(spec.label)) {
        labelError = 'Libellé de caractéristique dupliqué'
      }

      if (spec.label) {
        labels.add(spec.label)
      }

      if (labelError || valueError) {
        specsInvalid = true
      }

      return {
        ...spec,
        labelError,
        valueError,
      }
    })

    if (
      Object.keys(localFieldErrors).length > 0 ||
      specsInvalid ||
      parsedYear.value === undefined ||
      parsedPrice.value === undefined
    ) {
      setFieldErrors(localFieldErrors)
      setSpecs(validatedSpecs)
      setSubmitError('Vérifiez les informations du formulaire.')
      return
    }

    const nonEmptySpecs = validatedSpecs.filter(
      (spec) => spec.label || spec.value,
    )

    const body: {
      brandId: string
      bikeTypeId: string
      conditionId: string
      model: string
      year: number | null
      description: string
      priceCents: number
      specs: Array<{ label: string; value: string }>
      status?: 'available' | 'hidden'
    } = {
      brandId,
      bikeTypeId,
      conditionId,
      model: trimmedModel,
      year: parsedYear.value,
      description: trimmedDescription,
      priceCents: parsedPrice.value,
      specs: nonEmptySpecs.map((spec) => ({
        label: spec.label,
        value: spec.value,
      })),
    }

    if (product.status === 'available' || product.status === 'hidden') {
      body.status = editableStatus
    }

    setIsSubmitting(true)

    try {
      const updated = await apiRequest<AdminProduct>(
        `/admin/products/${productId}`,
        {
          method: 'PATCH',
          body,
        },
      )

      setProduct(updated)
      setBrandId(updated.brandId)
      setBikeTypeId(updated.bikeTypeId)
      setConditionId(updated.conditionId)
      setModel(updated.model)
      setYear(updated.year === null ? '' : String(updated.year))
      setDescription(updated.description)
      setPrice(priceCentsToInput(updated.priceCents))

      if (updated.status === 'available' || updated.status === 'hidden') {
        setEditableStatus(updated.status)
      }

      nextSpecKey.current = updated.specs.length + 1
      setSpecs(
        updated.specs.map((spec, index) => ({
          key: index + 1,
          label: spec.label,
          value: spec.value,
        })),
      )

      setSuccessMessage('Les modifications ont été enregistrées.')
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors(getProductFieldErrors(error))
          setSpecs((current) => getSpecErrors(error, current))
          setSubmitError('Vérifiez les informations du formulaire.')
        } else if (error.code === 'CONFLICT') {
          setSubmitError(error.message)
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError('Impossible d’enregistrer les modifications.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProduct() {
    if (!product || isDeleting || isSubmitting) {
      return
    }

    const confirmed = window.confirm(
      'Supprimer ce vélo du catalogue ? Il restera conservé dans la base de données et dans les historiques existants.',
    )

    if (!confirmed) {
      return
    }

    setDeleteError(null)
    setIsDeleting(true)

    try {
      await apiRequest(`/admin/products/${productId}`, {
        method: 'DELETE',
      })

      window.location.assign('/admin/produits')
    } catch (error) {
      if (error instanceof ApiClientError) {
        setDeleteError(error.message)
      } else {
        setDeleteError('Impossible de supprimer ce vélo.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <AdminShell title="Produits" eyebrow="Catalogue">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Modification du vélo">
            <div
              role="status"
              className="flex min-h-64 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Chargement du vélo…
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (loadState === 'not-found') {
    return (
      <AdminShell title="Produits" eyebrow="Catalogue">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Vélo introuvable">
            <div className="p-6">
              <p className="type-secondary text-muted-foreground">
                Ce vélo n’existe pas ou a été supprimé.
              </p>

              <a
                href="/admin/produits"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Retour aux produits
              </a>
            </div>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (loadState === 'error' || !product) {
    return (
      <AdminShell title="Produits" eyebrow="Catalogue">
        <div className="mx-auto max-w-5xl">
          <AdminPanel title="Impossible de charger le vélo">
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

  const statusLocked =
    product.status === 'reserved' || product.status === 'sold'

  return (
    <AdminShell title="Produits" eyebrow="Catalogue">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <a
            href="/admin/produits"
            className="type-secondary mb-5 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour aux produits
          </a>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">
                Modifier le vélo
              </h2>

              <p className="type-secondary mt-2 text-muted-foreground">
                Produit #{product.id}
              </p>
            </div>

            <StatusBadge tone={statusTone(product.status)}>
              {statusLabel(product.status)}
            </StatusBadge>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <fieldset disabled={isSubmitting} className="space-y-6">
            <AdminPanel
              title="Informations principales"
              description="Modifiez les informations commerciales et techniques du vélo."
            >
              <div className="grid gap-x-6 gap-y-6 p-5 md:grid-cols-2 lg:p-6">
                <ReferenceSelect
                  label="Marque"
                  type="brand"
                  options={references.brands}
                  value={brandId}
                  onChange={setBrandId}
                  onReferenceCreated={addReferenceToState}
                  error={fieldErrors.brandId}
                  disabled={isSubmitting}
                />

                <TextField
                  label="Modèle"
                  name="model"
                  value={model}
                  onChange={(event) => {
                    setModel(event.currentTarget.value)
                    setFieldErrors((current) => ({
                      ...current,
                      model: undefined,
                    }))
                  }}
                  required
                  error={fieldErrors.model}
                  placeholder="Ex. Marlin 8"
                />

                <ReferenceSelect
                  label="Type"
                  type="bikeType"
                  options={references.bikeTypes}
                  value={bikeTypeId}
                  onChange={setBikeTypeId}
                  onReferenceCreated={addReferenceToState}
                  error={fieldErrors.bikeTypeId}
                  disabled={isSubmitting}
                />

                <ReferenceSelect
                  label="État"
                  type="condition"
                  options={references.conditions}
                  value={conditionId}
                  onChange={setConditionId}
                  onReferenceCreated={addReferenceToState}
                  error={fieldErrors.conditionId}
                  disabled={isSubmitting}
                />

                <TextField
                  label="Année"
                  name="year"
                  value={year}
                  onChange={(event) => {
                    setYear(event.currentTarget.value)
                    setFieldErrors((current) => ({
                      ...current,
                      year: undefined,
                    }))
                  }}
                  inputMode="numeric"
                  error={fieldErrors.year}
                  placeholder="Ex. 2025"
                  hint="Facultatif."
                />

                <TextField
                  label="Prix"
                  name="price"
                  value={price}
                  onChange={(event) => {
                    setPrice(event.currentTarget.value)
                    setFieldErrors((current) => ({
                      ...current,
                      price: undefined,
                    }))
                  }}
                  inputMode="decimal"
                  placeholder="Ex. 1299,90"
                  required
                  error={fieldErrors.price}
                  hint="Montant en euros."
                />
              </div>
            </AdminPanel>

            <AdminPanel
              title="Description"
              description="Mettez à jour la présentation et les informations utiles à l’acheteur."
            >
              <div className="p-5 lg:p-6">
                <Field
                  label="Description du vélo"
                  htmlFor="product-edit-description"
                  error={fieldErrors.description}
                >
                  <textarea
                    id="product-edit-description"
                    rows={6}
                    required
                    value={description}
                    onChange={(event) => {
                      setDescription(event.currentTarget.value)
                      setFieldErrors((current) => ({
                        ...current,
                        description: undefined,
                      }))
                    }}
                    placeholder="Décrivez l’état général, l’utilisation, les éventuelles marques d’usure…"
                    className={`${fieldControlClassName} resize-y py-3`}
                    aria-invalid={fieldErrors.description ? true : undefined}
                  />
                </Field>
              </div>
            </AdminPanel>

            <AdminPanel
              title="Caractéristiques techniques"
              description="Modifiez, ajoutez ou retirez les caractéristiques de ce vélo."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpec}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Ajouter
                </Button>
              }
            >
              <div className="p-5 lg:p-6">
                {specs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm font-medium">
                      Aucune caractéristique
                    </p>
                    <p className="type-secondary mt-1 text-muted-foreground">
                      Ajoutez par exemple le cadre, la taille, la transmission
                      ou les freins.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {specs.map((spec, index) => (
                      <div
                        key={spec.key}
                        className="rounded-lg border border-border bg-brand-gray-50 p-3"
                      >
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
                          <div>
                            <label
                              htmlFor={`edit-spec-label-${spec.key}`}
                              className="type-label mb-2 block"
                            >
                              Caractéristique
                            </label>

                            <input
                              id={`edit-spec-label-${spec.key}`}
                              type="text"
                              value={spec.label}
                              onChange={(event) =>
                                updateSpec(
                                  spec.key,
                                  'label',
                                  event.currentTarget.value,
                                )
                              }
                              className={fieldControlClassName}
                              aria-invalid={spec.labelError ? true : undefined}
                              placeholder="Ex. Cadre"
                            />

                            {spec.labelError ? (
                              <p className="type-secondary mt-2 text-destructive">
                                {spec.labelError}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-spec-value-${spec.key}`}
                              className="type-label mb-2 block"
                            >
                              Valeur
                            </label>

                            <input
                              id={`edit-spec-value-${spec.key}`}
                              type="text"
                              value={spec.value}
                              onChange={(event) =>
                                updateSpec(
                                  spec.key,
                                  'value',
                                  event.currentTarget.value,
                                )
                              }
                              className={fieldControlClassName}
                              aria-invalid={spec.valueError ? true : undefined}
                              placeholder="Ex. Carbone"
                            />

                            {spec.valueError ? (
                              <p className="type-secondary mt-2 text-destructive">
                                {spec.valueError}
                              </p>
                            ) : null}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-7"
                            aria-label={`Supprimer la caractéristique ${index + 1}`}
                            onClick={() => removeSpec(spec.key)}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AdminPanel>

            <AdminPanel
              title="Publication"
              description={
                statusLocked
                  ? 'Le statut actuel est contrôlé par le workflow de vente et ne peut pas être modifié ici.'
                  : 'Choisissez si le vélo doit être visible dans le catalogue.'
              }
            >
              {statusLocked ? (
                <div className="p-5 lg:p-6">
                  <div className="rounded-xl border border-border bg-brand-gray-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Statut verrouillé</p>
                        <p className="type-secondary mt-1 text-muted-foreground">
                          Un vélo {statusLabel(product.status).toLowerCase()}{' '}
                          conserve son statut métier pendant cette modification.
                        </p>
                      </div>

                      <StatusBadge tone={statusTone(product.status)}>
                        {statusLabel(product.status)}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:p-6">
                  <label className="group cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="available"
                      checked={editableStatus === 'available'}
                      onChange={() => setEditableStatus('available')}
                      className="peer sr-only"
                    />

                    <span className="block rounded-xl border border-border bg-background p-5 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
                      <span className="flex items-center gap-3">
                        <span className="flex size-5 items-center justify-center rounded-full border border-brand-gray-400 bg-background">
                          <span className="size-2 rounded-full bg-primary opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
                        </span>

                        <span className="font-medium">Disponible</span>
                      </span>

                      <span className="type-secondary mt-2 block text-muted-foreground">
                        Le vélo apparaît dans le catalogue public.
                      </span>
                    </span>
                  </label>

                  <label className="group cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="hidden"
                      checked={editableStatus === 'hidden'}
                      onChange={() => setEditableStatus('hidden')}
                      className="peer sr-only"
                    />

                    <span className="block rounded-xl border border-border bg-background p-5 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
                      <span className="flex items-center gap-3">
                        <span className="flex size-5 items-center justify-center rounded-full border border-brand-gray-400 bg-background">
                          <span className="size-2 rounded-full bg-primary opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
                        </span>

                        <span className="font-medium">Masqué</span>
                      </span>

                      <span className="type-secondary mt-2 block text-muted-foreground">
                        Le vélo reste enregistré mais est invisible
                        publiquement.
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </AdminPanel>
          </fieldset>

          {submitError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {submitError}
            </p>
          ) : null}

          {successMessage ? (
            <p
              role="status"
              className="rounded-xl border border-border bg-background p-4 text-sm"
            >
              {successMessage}
            </p>
          ) : null}

          <div className="sticky bottom-4 z-10 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
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
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 lg:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h3 className="font-medium text-destructive">
                Supprimer ce vélo
              </h3>
              <p className="type-secondary mt-2 text-muted-foreground">
                Le vélo disparaîtra du catalogue et ne pourra plus être modifié
                depuis cette page. Ses données et les historiques existants
                resteront conservés.
              </p>
            </div>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || isSubmitting}
              onClick={() => void handleDeleteProduct()}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Suppression…
                </>
              ) : (
                <>
                  <Trash2 aria-hidden="true" className="size-4" />
                  Supprimer ce vélo
                </>
              )}
            </Button>
          </div>

          {deleteError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-background p-4 text-sm text-destructive"
            >
              {deleteError}
            </p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  )
}

function ReferenceSelect({
  label,
  type,
  options,
  value,
  onChange,
  onReferenceCreated,
  error,
  disabled,
}: {
  label: string
  type: ReferenceType
  options: ProductReference[]
  value: string
  onChange: (value: string) => void
  onReferenceCreated: (type: ReferenceType, reference: ProductReference) => void
  error?: string
  disabled?: boolean
}) {
  const [newName, setNewName] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAddReference() {
    if (isAdding || disabled) {
      return
    }

    const name = newName.trim()

    if (!name) {
      setAddError('Saisissez une valeur à ajouter.')
      return
    }

    setIsAdding(true)
    setAddError(null)

    try {
      const reference = await apiRequest<ProductReference>(
        '/admin/products/references',
        {
          method: 'POST',
          body: {
            type,
            name,
          },
        },
      )

      onReferenceCreated(type, reference)
      setNewName('')
      setIsCreateOpen(false)
    } catch (error) {
      if (error instanceof ApiClientError) {
        setAddError(error.message)
      } else {
        setAddError('Impossible d’ajouter cette valeur.')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const selectId = `edit-product-reference-${type}`

  const addLabel =
    type === 'brand'
      ? 'une marque'
      : type === 'bikeType'
        ? 'un type'
        : 'un état'

  return (
    <Field
      label={label}
      htmlFor={selectId}
      error={error}
      hint={
        options.length === 0 && !isCreateOpen
          ? 'Aucune valeur enregistrée pour le moment.'
          : undefined
      }
    >
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={fieldControlClassName}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
      >
        <option value="">Sélectionner…</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      {!isCreateOpen ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsCreateOpen(true)
            setAddError(null)
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          Ajouter {addLabel}
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-border bg-brand-gray-50 p-3">
          <p className="type-secondary mb-2 font-medium">Nouvelle valeur</p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(event) => {
                setNewName(event.currentTarget.value)
                setAddError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleAddReference()
                }

                if (event.key === 'Escape') {
                  setIsCreateOpen(false)
                  setNewName('')
                  setAddError(null)
                }
              }}
              className={fieldControlClassName}
              placeholder="Nouvelle valeur"
              disabled={disabled || isAdding}
              autoFocus
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false)
                  setNewName('')
                  setAddError(null)
                }}
                disabled={isAdding}
              >
                Annuler
              </Button>

              <Button
                type="button"
                onClick={() => void handleAddReference()}
                disabled={disabled || isAdding}
              >
                {isAdding ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Ajout…
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </div>

          {addError ? (
            <p role="alert" className="type-secondary mt-2 text-destructive">
              {addError}
            </p>
          ) : null}
        </div>
      )}
    </Field>
  )
}
