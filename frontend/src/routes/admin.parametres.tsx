import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import {
  AdminField,
  AdminPanel,
} from '@/components/admin/admin-ui'

export const Route = createFileRoute('/admin/parametres')({
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  return (
    <AdminShell title="Paramètres" eyebrow="Informations commerciales">
      <div className="max-w-3xl">
        <AdminPanel
          title="Coordonnées et livraison"
          description="Ces valeurs alimenteront les pages publiques et le checkout."
        >
          <form className="space-y-8 p-5 lg:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <AdminField
                label="Téléphone"
                name="phone"
                type="tel"
              />

              <AdminField
                label="Email"
                name="email"
                type="email"
              />

              <div className="sm:col-span-2">
                <AdminField
                  label="Adresse"
                  name="address"
                />
              </div>

              <AdminField
                label="Frais de livraison"
                name="deliveryFee"
                type="number"
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                L’état de sauvegarde sera affiché ici.
              </div>

              <button
                type="button"
                className="type-button min-h-11 rounded-md bg-primary px-6 text-primary-foreground"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
