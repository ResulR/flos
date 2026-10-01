import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Bike,
  MessageCircle,
  RefreshCcw,
  ScanSearch,
} from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/a-propos')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <PublicPage>
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-16 sm:py-20 lg:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
            À propos
          </p>

          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
            <h1 className="max-w-5xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.4rem,7vw,6.5rem)] font-normal leading-[0.92] tracking-[-0.06em] text-[#171717]">
              Le vélo d’occasion,
              <br />
              <span className="italic text-[#b44a42]">sans le compliquer.</span>
            </h1>

            <p className="max-w-md text-base font-light leading-relaxed text-muted-foreground">
              Flo’s Bikes construit une expérience simple autour du vélo de
              seconde main : comprendre ce qui est proposé, choisir plus
              facilement et pouvoir nous contacter quand c’est nécessaire.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#171717] text-white">
        <div className="site-container grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d66a62]">
              Notre approche
            </p>

            <h2 className="mt-4 max-w-xl font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Moins de friction.
              <br />
              Plus de clarté.
            </h2>
          </div>

          <div className="self-end">
            <p className="max-w-xl text-lg font-light leading-relaxed text-white/70">
              Un vélo d’occasion ne devrait pas être difficile à comprendre.
              Notre objectif est de présenter les vélos avec des informations
              lisibles et de garder un parcours simple, de la découverte jusqu’à
              la décision.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="site-container">
          <div className="grid gap-5 lg:grid-cols-3">
            <PrincipleCard
              icon={<ScanSearch aria-hidden="true" className="size-5" />}
              number="01"
              title="Voir clair"
              text="Les vélos sont présentés avec leurs informations essentielles pour pouvoir parcourir la sélection et les comparer plus facilement."
            />

            <PrincipleCard
              icon={<Bike aria-hidden="true" className="size-5" />}
              number="02"
              title="Choisir simplement"
              text="Catalogue, fiche vélo, panier, réservation et commande suivent un parcours pensé pour aller à l’essentiel."
            />

            <PrincipleCard
              icon={<MessageCircle aria-hidden="true" className="size-5" />}
              number="03"
              title="Rester accessible"
              text="Quand une question se pose, les coordonnées publiques de Flo’s Bikes permettent de garder un contact direct."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-black/8 bg-[#f7f5f1]">
        <div className="site-container grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:py-24">
          <div className="flex size-16 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
            <RefreshCcw aria-hidden="true" className="size-7" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b44a42]">
              Deux côtés du même parcours
            </p>

            <h2 className="mt-4 max-w-3xl font-[Georgia,'Times_New_Roman',serif] text-4xl font-normal leading-[1.02] tracking-[-0.045em] text-[#171717] sm:text-5xl">
              Trouver le prochain.
              <br />
              Proposer l’ancien.
            </h2>

            <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
              Flo’s Bikes permet aussi bien de parcourir les vélos disponibles
              que d’envoyer une demande de reprise pour un vélo que vous
              souhaitez vendre.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/catalogue"
                className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#171717] px-7 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2a]"
              >
                Voir les vélos
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </a>

              <a
                href="/reprise"
                className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-7 text-sm font-medium text-[#171717] transition-colors hover:border-black/30"
              >
                Proposer mon vélo
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function PrincipleCard({
  icon,
  number,
  title,
  text,
}: {
  icon: React.ReactNode
  number: string
  title: string
  text: string
}) {
  return (
    <article className="flex min-h-[22rem] flex-col justify-between rounded-[1.75rem] bg-[#f7f5f1] p-7 ring-1 ring-black/5 sm:p-8">
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-full bg-white text-[#b44a42] ring-1 ring-black/5">
          {icon}
        </span>

        <span className="text-xs font-medium tracking-[0.16em] text-black/30">
          {number}
        </span>
      </div>

      <div className="mt-12">
        <h3 className="font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717]">
          {title}
        </h3>

        <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </article>
  )
}
