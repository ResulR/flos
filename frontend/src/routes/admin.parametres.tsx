import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel } from '@/components/admin/admin-ui'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/parametres')({
  component: AdminSettingsPage,
})

type AdminSiteSettings = {
  phone: string | null
  email: string | null
  address: string | null
  deliveryFeeCents: string
}

function priceCentsToInput(value: string) {
  const cents = Number(value)

  if (!Number.isSafeInteger(cents) || cents < 0) {
    return ''
  }

  return (cents / 100).toFixed(2).replace('.', ',')
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  )
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      setLoadState('loading')

      try {
        const loadedSettings = await apiRequest<AdminSiteSettings>(
          '/admin/site-settings',
        )

        if (cancelled) {
          return
        }

        setSettings(loadedSettings)
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
            <form className="space-y-8 p-5 lg:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="type-label mb-2 block">Téléphone</span>
                  <input
                    name="phone"
                    type="tel"
                    className="form-control w-full"
                    value={settings.phone ?? ''}
                    readOnly
                  />
                </label>

                <label className="block">
                  <span className="type-label mb-2 block">Email</span>
                  <input
                    name="email"
                    type="email"
                    className="form-control w-full"
                    value={settings.email ?? ''}
                    readOnly
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="type-label mb-2 block">Adresse</span>
                  <input
                    name="address"
                    type="text"
                    className="form-control w-full"
                    value={settings.address ?? ''}
                    readOnly
                  />
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
                    value={priceCentsToInput(settings.deliveryFeeCents)}
                    readOnly
                  />
                  <span className="type-secondary mt-2 block text-muted-foreground">
                    Montant en euros.
                  </span>
                </label>
              </div>

              <div className="flex justify-end border-t border-border pt-6">
                <Button type="button" disabled>
                  Enregistrer
                </Button>
              </div>
            </form>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
