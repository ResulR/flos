import { createFileRoute } from '@tanstack/react-router'
import { LockKeyhole } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  return (
    <main className="grid min-h-screen bg-brand-gray-50 lg:grid-cols-2">
      <section className="hidden overflow-hidden bg-brand-black text-brand-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/flos-bikes-logo.png"
          alt="Flo's Bikes"
          className="h-12 w-auto self-start bg-white object-contain"
        />

        <div>
          <p className="type-label uppercase tracking-[0.16em] text-brand-red">
            Administration
          </p>

          <h1 className="type-display mt-4 max-w-xl">
            Gérer Flo&apos;s Bikes simplement.
          </h1>
        </div>

        <p className="type-secondary text-brand-gray-400">
          Accès réservé à l’administrateur.
        </p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <img
              src="/flos-bikes-logo.png"
              alt="Flo's Bikes"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="mt-10 lg:mt-0">
            <div className="flex size-11 items-center justify-center rounded-md bg-brand-black text-brand-white">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </div>

            <h1 className="type-heading-2 mt-6">Connexion</h1>

            <p className="type-body mt-3 text-muted-foreground">
              Utilisez le compte administrateur configuré pour accéder à la
              gestion du site.
            </p>
          </div>

          <form className="mt-8 space-y-5">
            <label className="block">
              <span className="type-label mb-2 block">Email</span>
              <input type="email" className="form-control w-full" />
            </label>

            <label className="block">
              <span className="type-label mb-2 block">Mot de passe</span>
              <input type="password" className="form-control w-full" />
            </label>

            <div
              role="status"
              className="rounded-md border border-border bg-brand-gray-50 px-4 py-3 text-sm text-muted-foreground"
            >
              En cas d’échec, un message neutre sera affiché ici.
            </div>

            <button
              type="button"
              className="type-button inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-primary-foreground hover:bg-brand-red-dark"
            >
              Se connecter
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
