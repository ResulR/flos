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
              Notre approche
            </p>

            <h2 className="type-heading-2 mt-3">
              Aller à l’essentiel, sans compliquer l’expérience.
            </h2>
          </div>

          <div className="space-y-5">
            <p className="type-body text-muted-foreground">
              Flo&apos;s Bikes se concentre sur une sélection de vélos
              d’occasion présentés avec des informations claires pour faciliter
              la comparaison et la prise de décision.
            </p>

            <p className="type-body text-muted-foreground">
              L’objectif est de proposer un parcours simple, aussi bien pour
              acheter un vélo que pour demander une reprise, avec un contact
              direct lorsque c’est nécessaire.
            </p>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}
