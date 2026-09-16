import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import {
  AdminField,
  AdminPanel,
  StatusBadge,
} from '@/components/admin/admin-ui'

export const Route = createFileRoute('/admin/produits')({
  component: AdminProductsPage,
})

function AdminProductsPage() {
  return (
    <AdminShell title="Produits" eyebrow="Catalogue">
      <AdminPanel
        title="Vélos"
        description="Chaque fiche représente un vélo physique unique."
        action={
          <button
            type="button"
            className="type-button inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-primary-foreground"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nouveau vélo
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-[44rem] text-left text-sm">
            <thead className="bg-brand-gray-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Vélo</th>
                <th className="px-5 py-3 font-medium">Prix</th>
                <th className="px-5 py-3 font-medium">État</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-5 py-4">
                  <p className="font-medium">Marque — Modèle</p>
                  <p className="type-secondary text-muted-foreground">
                    Année · Type
                  </p>
                </td>
                <td className="px-5 py-4">Prix</td>
                <td className="px-5 py-4">Très bon état</td>
                <td className="px-5 py-4">
                  <StatusBadge tone="positive">Disponible</StatusBadge>
                </td>
                <td className="px-5 py-4">
                  <button type="button" className="text-sm font-medium">
                    Modifier
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <div className="mt-8">
        <AdminPanel
          title="Créer / modifier un vélo"
          description="Le même formulaire sert à la création et à l’édition."
        >
          <form className="space-y-8 p-5 lg:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Marque" name="brand" />
              <AdminField label="Modèle" name="model" />
              <AdminField label="Année" name="year" type="number" />
              <AdminField label="Prix" name="price" type="number" />

              <label className="block">
                <span className="type-label mb-2 block">État</span>
                <select className="form-control w-full">
                  <option>Très bon état</option>
                  <option>Bon état</option>
                  <option>État correct</option>
                </select>
              </label>

              <label className="block">
                <span className="type-label mb-2 block">Type</span>
                <select className="form-control w-full">
                  <option>À définir</option>
                </select>
              </label>

              <label className="block">
                <span className="type-label mb-2 block">Statut</span>
                <select className="form-control w-full">
                  <option>Disponible</option>
                  <option>Réservé</option>
                  <option>Vendu</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="type-label mb-2 block">Description</span>
              <textarea rows={5} className="form-control w-full py-3" />
            </label>

            <label className="block">
              <span className="type-label mb-2 block">Fiche technique</span>
              <textarea
                rows={6}
                className="form-control w-full py-3"
                placeholder="Les champs structurés définitifs seront reliés au modèle produit."
              />
            </label>

            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-brand-gray-400 bg-brand-gray-50 p-6 text-center">
              <ImagePlus aria-hidden="true" className="size-6 text-primary" />
              <span className="mt-3 font-medium">Ajouter plusieurs photos</span>
              <input type="file" multiple className="sr-only" />
            </label>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-medium"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Supprimer
              </button>

              <button
                type="button"
                className="type-button min-h-11 rounded-md bg-primary px-6 text-primary-foreground"
              >
                Enregistrer
              </button>
            </div>

            <p className="type-secondary text-muted-foreground">
              « Supprimer » effectuera un soft delete : la fiche ne sera pas
              supprimée physiquement de la base de données.
            </p>
          </form>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
