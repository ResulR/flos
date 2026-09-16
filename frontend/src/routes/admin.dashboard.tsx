import { createFileRoute } from '@tanstack/react-router'

import { AdminShell } from '@/components/admin/admin-shell'
import {
  AdminPanel,
  MetricCard,
  StatusBadge,
} from '@/components/admin/admin-ui'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard" eyebrow="Mois en cours">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Ventes" detail="Mois en cours" />
        <MetricCard label="Chiffre d’affaires" detail="Mois en cours" />
        <MetricCard label="Vélos disponibles" />
        <MetricCard label="Réservations actives" />
        <MetricCard label="Nouvelles reprises" />
      </div>

      <div className="mt-8">
        <AdminPanel
          title="Commandes récentes"
          description="Les dernières commandes nécessitant votre attention."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-gray-50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Commande</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Paiement</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-5 py-4 font-medium">#XXXX</td>
                  <td className="px-5 py-4">Client</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="positive">Payé</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge>En préparation</StatusBadge>
                  </td>
                  <td className="px-5 py-4">Montant</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
