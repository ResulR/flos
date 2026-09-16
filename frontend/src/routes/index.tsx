import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Bike, RefreshCcw } from 'lucide-react'

import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <>
      <PublicHeader />

      <main>
        <section className="overflow-hidden bg-brand-black text-brand-white">
          <div className="site-container grid min-h-[34rem] items-stretch lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center py-16 lg:py-24">
              <p className="type-label mb-5 uppercase tracking-[0.18em] text-brand-red">
                Flo&apos;s Bikes
              </p>

              <h1 className="type-display max-w-3xl text-brand-white">
                Le vélo d&apos;occasion,
                <span className="block text-brand-red">sans compromis.</span>
              </h1>

              <p className="type-body mt-6 max-w-xl text-brand-gray-400">
                Découvrez une sélection de vélos de seconde main dans un univers
                simple, transparent et pensé pour aller droit à
                l&apos;essentiel.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/catalogue"
                  className="type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-primary-foreground transition-colors hover:bg-brand-red-dark"
                >
                  Voir le catalogue
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>

                <a
                  href="/reprise"
                  className="type-button inline-flex min-h-12 items-center justify-center rounded-md border border-brand-gray-600 px-6 text-brand-white transition-colors hover:border-brand-white"
                >
                  Faire reprendre mon vélo
                </a>
              </div>
            </div>

            <div className="relative hidden min-h-[34rem] lg:block">
              <div className="absolute inset-y-0 left-12 w-px bg-brand-gray-800" />
              <div className="absolute right-[-9rem] top-1/2 size-[31rem] -translate-y-1/2 rounded-full border-[5rem] border-brand-red" />
              <div className="absolute right-[7rem] top-1/2 size-[15rem] -translate-y-1/2 rounded-full border-[2.5rem] border-brand-white/10" />

              <div className="absolute bottom-12 left-12 max-w-xs border-l-2 border-brand-red pl-5">
                <p className="type-heading-3 text-brand-white">
                  Occasion.
                  <br />
                  Sélection.
                  <br />
                  Confiance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="site-container">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="type-label uppercase tracking-[0.16em] text-primary">
                  À découvrir
                </p>

                <h2 className="type-heading-2 mt-3">
                  Une sélection qui change.
                </h2>
              </div>

              <a
                href="/catalogue"
                className="type-label inline-flex items-center gap-2 text-foreground hover:text-primary"
              >
                Tout le catalogue
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="surface-card overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/3] bg-brand-gray-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-20 rounded bg-brand-gray-100" />
                    <div className="h-6 w-2/3 rounded bg-brand-gray-100" />
                    <div className="h-7 w-24 rounded bg-brand-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-brand-gray-50">
          <div className="site-container grid gap-px bg-border md:grid-cols-3">
            <ValueItem
              icon={<BadgeCheck aria-hidden="true" className="size-6" />}
              title="Des vélos clairement présentés"
              text="L’état et les informations essentielles doivent rester faciles à comprendre."
            />

            <ValueItem
              icon={<Bike aria-hidden="true" className="size-6" />}
              title="Le produit avant le décor"
              text="Des pages pensées pour laisser le vélo au centre de l’expérience."
            />

            <ValueItem
              icon={<RefreshCcw aria-hidden="true" className="size-6" />}
              title="Acheter ou faire reprendre"
              text="Deux parcours séparés, accessibles rapidement depuis le site."
            />
          </div>
        </section>

        <section className="section-space bg-brand-red text-brand-white">
          <div className="site-container grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="type-label uppercase tracking-[0.16em] text-brand-white/70">
                Reprise
              </p>

              <h2 className="type-heading-2 mt-3 max-w-2xl text-brand-white">
                Votre ancien vélo peut commencer une nouvelle histoire.
              </h2>

              <p className="type-body mt-5 max-w-xl text-brand-white/80">
                Envoyez les informations que vous connaissez et quelques photos.
                Les détails techniques pourront être complétés ensuite.
              </p>
            </div>

            <a
              href="/reprise"
              className="type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-black px-6 text-brand-white transition-colors hover:bg-brand-charcoal"
            >
              Demander une reprise
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </section>

        <section className="section-space">
          <div className="site-container grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative min-h-[22rem] overflow-hidden rounded-xl bg-brand-black">
              <div className="absolute -bottom-24 -left-20 size-72 rounded-full border-[3.75rem] border-brand-red" />
              <div className="absolute right-8 top-8 type-label uppercase tracking-[0.16em] text-brand-white">
                Flo&apos;s Bikes
              </div>
            </div>

            <div>
              <p className="type-label uppercase tracking-[0.16em] text-primary">
                Le magasin
              </p>

              <h2 className="type-heading-2 mt-3">
                Un commerce spécialisé dans le vélo d&apos;occasion.
              </h2>

              <p className="type-body mt-5 max-w-xl text-muted-foreground">
                Flo&apos;s Bikes met l&apos;accent sur une sélection claire, une
                expérience simple et un contact direct avec le vendeur.
              </p>

              <a
                href="/a-propos"
                className="type-label mt-7 inline-flex items-center gap-2 text-foreground hover:text-primary"
              >
                Découvrir Flo&apos;s Bikes
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  )
}

function ValueItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="bg-brand-gray-50 px-6 py-8 lg:px-8 lg:py-10">
      <div className="text-primary">{icon}</div>

      <h3 className="mt-5 text-xl font-medium leading-tight">{title}</h3>

      <p className="type-secondary mt-3 max-w-sm text-muted-foreground">
        {text}
      </p>
    </div>
  )
}
