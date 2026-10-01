import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  PublicPage,
  type PublicContactDetails,
} from '@/components/layout/public-page'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  return (
    <PublicPage>{(contact) => <ContactContent contact={contact} />}</PublicPage>
  )
}

function ContactContent({ contact }: { contact: PublicContactDetails | null }) {
  const hasContact =
    Boolean(contact?.phone) ||
    Boolean(contact?.email) ||
    Boolean(contact?.address)

  return (
    <>
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-16 sm:py-20 lg:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
            Contact
          </p>

          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
            <h1 className="max-w-4xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3.3rem,6.5vw,6rem)] font-normal leading-[0.93] tracking-[-0.06em] text-[#171717]">
              Une question ?
              <br />
              Parlons vélo.
            </h1>

            <p className="max-w-md text-base font-light leading-relaxed text-muted-foreground">
              Un vélo vous intéresse, vous avez une question sur une commande,
              une réservation ou une reprise ? Contactez directement Flo’s
              Bikes.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18 lg:py-24">
        <div className="site-container">
          {!hasContact ? (
            <div className="mx-auto max-w-2xl rounded-[2rem] bg-[#f7f5f1] px-6 py-14 text-center ring-1 ring-black/5 sm:px-10">
              <h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl font-normal tracking-[-0.035em] text-[#171717] sm:text-4xl">
                Coordonnées bientôt disponibles.
              </h2>

              <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
                Les informations de contact de Flo’s Bikes n’ont pas encore été
                configurées.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contact?.phone ? (
                <ContactCard
                  icon={<Phone aria-hidden="true" className="size-5" />}
                  eyebrow="Téléphone"
                  value={contact.phone}
                  description="Appelez-nous directement."
                  href={`tel:${contact.phone}`}
                />
              ) : null}

              {contact?.email ? (
                <ContactCard
                  icon={<Mail aria-hidden="true" className="size-5" />}
                  eyebrow="Email"
                  value={contact.email}
                  description="Écrivez-nous par email."
                  href={`mailto:${contact.email}`}
                />
              ) : null}

              {contact?.address ? (
                <ContactCard
                  icon={<MapPin aria-hidden="true" className="size-5" />}
                  eyebrow="Adresse"
                  value={contact.address}
                  description="Adresse publique de Flo’s Bikes."
                />
              ) : null}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function ContactCard({
  icon,
  eyebrow,
  value,
  description,
  href,
}: {
  icon: ReactNode
  eyebrow: string
  value: string
  description: string
  href?: string
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-[#f7f5f1] text-[#b44a42] ring-1 ring-black/5">
          {icon}
        </span>

        {href ? (
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 text-black/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#b44a42]"
          />
        ) : null}
      </div>

      <div className="mt-10">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>

        <p className="mt-3 break-words font-[Georgia,'Times_New_Roman',serif] text-2xl font-normal tracking-[-0.03em] text-[#171717] sm:text-3xl">
          {value}
        </p>

        <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </>
  )

  const className =
    'group flex min-h-[19rem] flex-col justify-between rounded-[1.75rem] bg-[#f7f5f1] p-6 ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:ring-black/10 sm:p-7'

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}
