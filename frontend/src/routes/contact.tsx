import { createFileRoute } from '@tanstack/react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

import { FlowState } from '@/components/feedback/flow-state'
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
    <section className="site-container section-space">
      <div className="max-w-3xl">
        <p className="type-label uppercase tracking-[0.16em] text-primary">
          Contact
        </p>

        <h1 className="type-display mt-3">Parlons vélo.</h1>

        <p className="type-body mt-5 text-muted-foreground">
          Une question sur un vélo, une réservation ou une reprise ? Retrouvez
          ici les coordonnées de Flo&apos;s Bikes.
        </p>
      </div>

      <div className="mt-12">
        {!hasContact ? (
          <FlowState
            kind="empty"
            title="Coordonnées bientôt disponibles"
            description="Les informations de contact n’ont pas encore été configurées."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {contact?.phone ? (
              <ContactCard
                icon={<Phone aria-hidden="true" className="size-6" />}
                title="Téléphone"
                value={contact.phone}
                href={`tel:${contact.phone}`}
              />
            ) : null}

            {contact?.email ? (
              <ContactCard
                icon={<Mail aria-hidden="true" className="size-6" />}
                title="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
              />
            ) : null}

            {contact?.address ? (
              <ContactCard
                icon={<MapPin aria-hidden="true" className="size-6" />}
                title="Adresse"
                value={contact.address}
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactCard({
  icon,
  title,
  value,
  href,
}: {
  icon: ReactNode
  title: string
  value: string
  href?: string
}) {
  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="text-primary">{icon}</div>

      <h2 className="type-heading-3 mt-5">{title}</h2>

      {href ? (
        <a
          href={href}
          className="type-body mt-3 block break-words text-muted-foreground transition-colors hover:text-primary"
        >
          {value}
        </a>
      ) : (
        <p className="type-body mt-3 break-words text-muted-foreground">
          {value}
        </p>
      )}
    </div>
  )
}
