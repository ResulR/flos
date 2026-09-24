import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/produits')({
  component: AdminProductsPage,
})

type AdminProductStatus = 'available' | 'reserved' | 'sold' | 'hidden'

type AdminProductListItem = {
  id: string
  brand: string
  model: string
  bikeType: string
  condition: string
  year: number | null
  priceCents: string
  status: AdminProductStatus
  isActive: boolean
  updatedAt: string
}

function statusLabel(status: AdminProductStatus) {
  switch (status) {
    case 'available':
      return 'Disponible'
    case 'reserved':
      return 'Réservé'
    case 'sold':
      return 'Vendu'
    case 'hidden':
      return 'Masqué'
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

function formatPrice(priceCents: string) {
  const cents = Number(priceCents)

  if (!Number.isSafeInteger(cents)) {
    return '—'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setState('loading')

      try {
        const result =
          await apiRequest<AdminProductListItem[]>('/admin/products')

        if (cancelled) {
          return
        }

        setProducts(result)
        setState('ready')
      } catch {
        if (!cancelled) {
          setState('error')
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [attempt])

  return (
    <AdminShell title="Produits" eyebrow="Catalogue">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">
            Tous les vélos
          </h2>
          <p className="type-secondary mt-2 max-w-2xl text-muted-foreground">
            Retrouvez les vélos du catalogue et ouvrez leur fiche pour les
            modifier ou les supprimer.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => window.location.assign('/admin/produits/nouveau')}
          className="w-full sm:w-auto"
        >
          <Plus aria-hidden="true" className="size-4" />
          Ajouter un vélo
        </Button>
      </div>

      <AdminPanel
        title="Catalogue"
        description="Les vélos supprimés ne sont plus affichés ici."
      >
        {state === 'loading' ? (
          <div
            role="status"
            className="flex min-h-56 items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
          >
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Chargement des vélos…
          </div>
        ) : state === 'error' ? (
          <div className="p-6">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-medium">Impossible de charger les vélos.</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Vérifiez la connexion au serveur puis réessayez.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setAttempt((current) => current + 1)}
              >
                Réessayer
              </Button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">Aucun vélo enregistré</p>
            <p className="type-secondary mt-2 text-muted-foreground">
              Ajoutez votre premier vélo pour commencer à remplir le catalogue.
            </p>

            <Button
              type="button"
              className="mt-5"
              onClick={() => window.location.assign('/admin/produits/nouveau')}
            >
              <Plus aria-hidden="true" className="size-4" />
              Ajouter un vélo
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[58rem] w-full text-left text-sm">
              <thead className="bg-brand-gray-50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Vélo</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">État</th>
                  <th className="px-5 py-3 font-medium">Année</th>
                  <th className="px-5 py-3 font-medium">Prix</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Modifié</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-border align-middle"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {product.brand} {product.model}
                      </p>
                      <p className="type-secondary mt-1 text-muted-foreground">
                        Produit #{product.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">{product.bikeType}</td>
                    <td className="px-5 py-4">{product.condition}</td>
                    <td className="px-5 py-4">{product.year ?? '—'}</td>
                    <td className="px-5 py-4 font-medium">
                      {formatPrice(product.priceCents)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge tone={statusTone(product.status)}>
                        {statusLabel(product.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(product.updatedAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/admin/produits/${product.id}`}
                        className="inline-flex min-h-10 items-center rounded-md border border-brand-black px-4 text-sm font-medium text-brand-black transition-colors hover:bg-brand-gray-50"
                      >
                        Ouvrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </AdminShell>
  )
}
