import { createFileRoute } from '@tanstack/react-router'
import { Mail, Phone } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  return (
    <PublicPage>
      <section className="site-container section-space">
        <div className="max-w-3xl">
          <p className="type-label uppercase tracking-[0.16em] text-primary">
            Contact
          </p>

          <h1 className="type-display mt-3">Parlons vélo.</h1>

          <p className="type-body mt-5 text-muted-foreground">
            Les coordonnées affichées ici seront chargées depuis les paramètres
            administrables du site.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <ContactCard
            icon={<Phone aria-hidden="true" className="size-6" />}
            title="Téléphone"
            value="Numéro configuré dans l’administration"
          />

          <ContactCard
            icon={<Mail aria-hidden="true" className="size-6" />}
            title="Email"
            value="Adresse configurée dans l’administration"
          />
        </div>
      </section>
    </PublicPage>
  )
}

function ContactCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="surface-card p-6 lg:p-8">
      <div className="text-primary">{icon}</div>
      <h2 className="type-heading-3 mt-5">{title}</h2>
      <p className="type-body mt-3 text-muted-foreground">{value}</p>
    </div>
  )
}
