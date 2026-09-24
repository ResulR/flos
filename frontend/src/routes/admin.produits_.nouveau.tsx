import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { Field, TextField, fieldControlClassName } from '@/components/ui/field'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/produits_/nouveau')({
  component: AdminProductsPage,
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

type CreatedProduct = {
  id: string
  brandId: string
  bikeTypeId: string
  conditionId: string
  model: string
  year: number | null
  description: string
  priceCents: string
  status: 'available' | 'hidden'
  isActive: boolean
  specs: Array<{
    id: string
    label: string
    value: string
  }>
  createdAt: string
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

function AdminProductsPage() {
  const [references, setReferences] = useState<ProductReferences>({
    brands: [],
    bikeTypes: [],
    conditions: [],
  })
  const [referencesState, setReferencesState] = useState<
    'loading' | 'ready' | 'error'
  >('loading')
  const [referencesAttempt, setReferencesAttempt] = useState(0)

  const [brandId, setBrandId] = useState('')
  const [bikeTypeId, setBikeTypeId] = useState('')
  const [conditionId, setConditionId] = useState('')

  const nextSpecKey = useRef(1)
  const [specs, setSpecs] = useState<SpecDraft[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false

    async function loadReferences() {
      setReferencesState('loading')

      try {
        const result = await apiRequest<ProductReferences>(
          '/admin/products/references',
        )

        if (cancelled) {
          return
        }

        setReferences({
          brands: sortReferences(result.brands),
          bikeTypes: sortReferences(result.bikeTypes),
          conditions: sortReferences(result.conditions),
        })
        setReferencesState('ready')
      } catch {
        if (!cancelled) {
          setReferencesState('error')
        }
      }
    }

    void loadReferences()

    return () => {
      cancelled = true
    }
  }, [referencesAttempt])

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

    if (isSubmitting || referencesState !== 'ready') {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    setSubmitError(null)
    setFieldErrors({})
    setCreatedProduct(null)

    const model = String(formData.get('model') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const status = String(formData.get('status') ?? 'available')

    const parsedYear = parseOptionalYear(String(formData.get('year') ?? ''))
    const parsedPrice = parsePrice(String(formData.get('price') ?? ''))

    const localFieldErrors: ProductFieldErrors = {
      ...(!brandId ? { brandId: 'Marque requise' } : {}),
      ...(!bikeTypeId ? { bikeTypeId: 'Type requis' } : {}),
      ...(!conditionId ? { conditionId: 'État requis' } : {}),
      ...(!model ? { model: 'Modèle requis' } : {}),
      ...(parsedYear.error ? { year: parsedYear.error } : {}),
      ...(parsedPrice.error ? { price: parsedPrice.error } : {}),
      ...(!description ? { description: 'Description requise' } : {}),
    }

    const trimmedSpecs = specs.map((spec) => ({
      ...spec,
      label: spec.label.trim(),
      value: spec.value.trim(),
      labelError: undefined,
      valueError: undefined,
    }))

    const nonEmptySpecs = trimmedSpecs.filter(
      (spec) => spec.label || spec.value,
    )

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
      parsedPrice.value === undefined ||
      parsedYear.value === undefined
    ) {
      setFieldErrors(localFieldErrors)
      setSpecs(validatedSpecs)
      setSubmitError('Vérifiez les informations du formulaire.')
      return
    }

    if (status !== 'available' && status !== 'hidden') {
      setSubmitError('Statut invalide.')
      return
    }

    setIsSubmitting(true)

    try {
      const product = await apiRequest<CreatedProduct>('/admin/products', {
        method: 'POST',
        body: {
          brandId,
          bikeTypeId,
          conditionId,
          model,
          year: parsedYear.value,
          description,
          priceCents: parsedPrice.value,
          status,
          isActive: true,
          specs: nonEmptySpecs.map((spec) => ({
            label: spec.label,
            value: spec.value,
          })),
        },
      })

      setCreatedProduct(product)

      form.reset()
      setBrandId('')
      setBikeTypeId('')
      setConditionId('')
      setSpecs([])
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors(getProductFieldErrors(error))
          setSpecs((current) => getSpecErrors(error, current))
          setSubmitError('Vérifiez les informations du formulaire.')
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError('Impossible de créer le vélo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminShell title="Produits" eyebrow="Catalogue">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-medium tracking-tight">
            Ajouter un vélo
          </h2>
          <p className="type-secondary mt-2 max-w-2xl text-muted-foreground">
            Créez la fiche du vélo. Les photos seront ajoutées dans une étape
            dédiée.
          </p>
        </div>

        {referencesState === 'loading' ? (
          <AdminPanel title="Nouveau vélo">
            <div
              role="status"
              className="flex min-h-48 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Chargement des informations…
            </div>
          </AdminPanel>
        ) : referencesState === 'error' ? (
          <AdminPanel title="Nouveau vélo">
            <div className="p-6">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <p className="font-medium">
                  Impossible de charger les marques, types et états.
                </p>
                <p className="type-secondary mt-2 text-muted-foreground">
                  Vérifiez la connexion au serveur puis réessayez.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setReferencesAttempt((current) => current + 1)}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </AdminPanel>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <fieldset disabled={isSubmitting} className="space-y-6">
              <AdminPanel
                title="Informations principales"
                description="Les informations essentielles pour identifier et vendre le vélo."
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
                    inputMode="numeric"
                    error={fieldErrors.year}
                    placeholder="Ex. 2025"
                    hint="Facultatif."
                  />

                  <TextField
                    label="Prix"
                    name="price"
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
                description="Présentez le vélo, son historique et les informations importantes pour l’acheteur."
              >
                <div className="p-5 lg:p-6">
                  <Field
                    label="Description du vélo"
                    htmlFor="product-description"
                    error={fieldErrors.description}
                  >
                    <textarea
                      id="product-description"
                      name="description"
                      rows={6}
                      required
                      placeholder="Décrivez l’état général, l’utilisation, les éventuelles marques d’usure…"
                      className={`${fieldControlClassName} resize-y py-3`}
                      aria-invalid={fieldErrors.description ? true : undefined}
                    />
                  </Field>
                </div>
              </AdminPanel>

              <AdminPanel
                title="Caractéristiques techniques"
                description="Ajoutez uniquement les informations utiles à ce vélo."
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
                        Aucune caractéristique ajoutée
                      </p>
                      <p className="type-secondary mt-1 text-muted-foreground">
                        Par exemple : cadre, taille, transmission ou freins.
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
                                htmlFor={`spec-label-${spec.key}`}
                                className="type-label mb-2 block"
                              >
                                Caractéristique
                              </label>

                              <input
                                id={`spec-label-${spec.key}`}
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
                                aria-invalid={
                                  spec.labelError ? true : undefined
                                }
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
                                htmlFor={`spec-value-${spec.key}`}
                                className="type-label mb-2 block"
                              >
                                Valeur
                              </label>

                              <input
                                id={`spec-value-${spec.key}`}
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
                                aria-invalid={
                                  spec.valueError ? true : undefined
                                }
                                placeholder="Ex. Aluminium"
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
                description="Choisissez si le vélo doit être visible immédiatement sur le site."
              >
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:p-6">
                  <label className="group cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="available"
                      defaultChecked
                      className="peer sr-only"
                    />

                    <span className="block rounded-xl border border-border bg-background p-5 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
                      <span className="flex items-center gap-3">
                        <span className="flex size-5 items-center justify-center rounded-full border border-brand-gray-400 bg-background peer-checked:border-primary">
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
                        Le vélo est enregistré mais invisible publiquement.
                      </span>
                    </span>
                  </label>
                </div>
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

            {createdProduct ? (
              <div
                role="status"
                className="rounded-xl border border-border bg-background p-5"
              >
                <p className="font-medium">Vélo créé avec succès.</p>
                <p className="type-secondary mt-1 text-muted-foreground">
                  {createdProduct.model} · produit #{createdProduct.id}
                  {createdProduct.status === 'hidden'
                    ? ' · masqué du catalogue public'
                    : ''}
                </p>
              </div>
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
                      Création…
                    </>
                  ) : (
                    'Créer le vélo'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
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

  const selectId = `product-reference-${type}`

  return (
    <Field
      label={label}
      htmlFor={selectId}
      error={error}
      hint={
        options.length === 0 && !isCreateOpen
          ? `Aucune valeur enregistrée pour le moment.`
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
          Ajouter{' '}
          {label.toLowerCase() === 'état'
            ? 'un état'
            : `une ${label.toLowerCase()}`}
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
              placeholder={`Nouvelle valeur`}
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
