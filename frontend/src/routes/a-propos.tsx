import { createFileRoute } from '@tanstack/react-router'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/a-propos')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <PublicPage>
      <section className="overflow-hidden bg-brand-black text-brand-white">
        <div className="site-container grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="type-label uppercase tracking-[0.16em] text-brand-red">
              À propos
            </p>

            <h1 className="type-display mt-3">
              Le vélo d’occasion, présenté autrement.
            </h1>

            <p className="type-body mt-6 max-w-xl text-brand-gray-400">
              Flo&apos;s Bikes développe une expérience simple autour du vélo
              d’occasion, avec une présentation claire des produits et un
              contact direct.
            </p>
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-xl bg-brand-charcoal">
            <div className="absolute -right-24 top-1/2 size-80 -translate-y-1/2 rounded-full border-[4rem] border-brand-red" />
          </div>
        </div>
      </section>

      <section className="site-container section-space">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="type-label uppercase tracking-[0.12em] text-primary">
              Flo&apos;s Bikes
            </p>
            <h2 className="type-heading-2 mt-3">Une histoire à compléter.</h2>
          </div>

          <p className="type-body text-muted-foreground">
            Le contenu réel sur l’histoire du magasin, son fondateur et son
            positionnement sera ajouté à partir des informations fournies par
            le propriétaire. Aucun élément biographique n’est inventé ici.
          </p>
        </div>
      </section>
    </PublicPage>
  )
}
