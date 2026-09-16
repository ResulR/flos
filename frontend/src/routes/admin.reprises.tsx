import { createFileRoute } from '@tanstack/react-router'

import { AdminShell } from '@/components/admin/admin-shell'
import {
  AdminField,
  AdminPanel,
  StatusBadge,
} from '@/components/admin/admin-ui'

export const Route = createFileRoute('/admin/reprises')({
  component: AdminTradeInsPage,
})

function AdminTradeInsPage() {
  return (
    <AdminShell title="Reprises" eyebrow="Demandes clients">
      <AdminPanel
        title="Demandes de reprise"
        description="Filtrables selon leur état de traitement."
      >
        <div className="border-b border-border p-5">
          <select className="form-control w-full max-w-xs">
            <option>Tous les statuts</option>
            <option>Nouvelle</option>
            <option>En cours</option>
            <option>Proposition envoyée</option>
            <option>Acceptée</option>
            <option>Refusée</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-brand-gray-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Vélo</th>
                <th className="px-5 py-3 font-medium">Prix souhaité</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t border-border">
                <td className="px-5 py-4">Client</td>
                <td className="px-5 py-4">Informations disponibles</td>
                <td className="px-5 py-4">—</td>
                <td className="px-5 py-4">
                  <StatusBadge tone="warning">Nouvelle</StatusBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_22rem]">
        <AdminPanel title="Détail de la demande">
          <div className="space-y-8 p-5">
            <div>
              <p className="type-label">Client</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Nom, email et téléphone
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <p className="type-label">Photos</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="aspect-square rounded-lg bg-brand-gray-100"
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="type-label">Informations vélo</p>
              <p className="type-secondary mt-2 text-muted-foreground">
                Marque, modèle, année, description et prix souhaité lorsqu’ils
                ont été fournis.
              </p>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Décision">
          <div className="space-y-5 p-5">
            <AdminField
              label="Prix proposé"
              name="proposedPrice"
              type="number"
            />

            <label className="block">
              <span className="type-label mb-2 block">Note interne</span>
              <textarea rows={5} className="form-control w-full py-3" />
            </label>

            <label className="block">
              <span className="type-label mb-2 block">Statut</span>
              <select className="form-control w-full">
                <option>Nouvelle</option>
                <option>En cours</option>
                <option>Proposition envoyée</option>
                <option>Acceptée</option>
                <option>Refusée</option>
              </select>
            </label>

            <button
              type="button"
              className="type-button min-h-11 w-full rounded-md bg-primary px-5 text-primary-foreground"
            >
              Enregistrer
            </button>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
