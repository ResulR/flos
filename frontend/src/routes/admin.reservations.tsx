import { createFileRoute } from '@tanstack/react-router'
import { Clock3 } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'

export const Route = createFileRoute('/admin/reservations')({
  component: AdminReservationsPage,
})

function AdminReservationsPage() {
  return (
    <AdminShell title="Réservations" eyebrow="Disponibilité">
      <AdminPanel
        title="Réservations"
        description="Les expirations automatiques et actions manuelles restent clairement distinctes."
      >
        <div className="overflow-x-auto">
          <table className="min-w-[44rem] text-left text-sm">
            <thead className="bg-brand-gray-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Vélo</th>
                <th className="px-5 py-3 font-medium">Expiration</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t border-border">
                <td className="px-5 py-4">Client</td>
                <td className="px-5 py-4 font-medium">Marque — Modèle</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Clock3 aria-hidden="true" className="size-4 text-primary" />
                    Date et heure
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge tone="warning">Active</StatusBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div className="mt-8">
        <AdminPanel title="Actions manuelles">
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div className="rounded-lg border border-border p-5">
              <p className="font-medium">Vente réalisée sur place</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Marque la réservation comme conclue et le vélo comme vendu.
              </p>
              <button
                type="button"
                className="mt-5 min-h-10 rounded-md bg-brand-black px-4 text-sm font-medium text-brand-white"
              >
                Confirmer la vente
              </button>
            </div>

            <div className="rounded-lg border border-border p-5">
              <p className="font-medium">Annuler la réservation</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Rend manuellement le vélo disponible avant son expiration.
              </p>
              <button
                type="button"
                className="mt-5 min-h-10 rounded-md border border-border px-4 text-sm font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
