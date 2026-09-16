import { createFileRoute } from '@tanstack/react-router'

import { AdminShell } from '@/components/admin/admin-shell'
import { AdminPanel, StatusBadge } from '@/components/admin/admin-ui'

export const Route = createFileRoute('/admin/commandes')({
  component: AdminOrdersPage,
})

function AdminOrdersPage() {
  return (
    <AdminShell title="Commandes" eyebrow="Ventes">
      <AdminPanel
        title="Toutes les commandes"
        description="Paiement et traitement restent visibles séparément."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-brand-gray-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Commande</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Paiement</th>
                <th className="px-5 py-3 font-medium">Traitement</th>
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

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_20rem]">
        <AdminPanel title="Détail commande">
          <div className="space-y-6 p-5">
            <div>
              <p className="type-label">Client</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Nom, email et téléphone
              </p>
            </div>

            <div className="border-t border-border pt-5">
              <p className="type-label">Produits</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <span>Marque — Modèle</span>
                <span className="font-medium">Prix</span>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <p className="type-label">Réception</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Livraison ou retrait, avec adresse uniquement si nécessaire.
              </p>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Traitement">
          <div className="p-5">
            <label className="block">
              <span className="type-label mb-2 block">Statut</span>
              <select className="form-control w-full">
                <option>Confirmée</option>
                <option>En préparation</option>
                <option>Expédiée</option>
                <option>Terminée</option>
              </select>
            </label>

            <button
              type="button"
              className="type-button mt-5 min-h-11 w-full rounded-md bg-primary px-5 text-primary-foreground"
            >
              Mettre à jour
            </button>

            <p className="type-secondary mt-4 text-muted-foreground">
              Aucun remboursement Stripe automatisé n’est prévu en V1.
            </p>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
