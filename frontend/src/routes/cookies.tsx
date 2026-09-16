import { createFileRoute } from '@tanstack/react-router'

import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Politique de cookies"
    >
      <LegalSection title="Utilisation des cookies">
        <p>
          Cette page sera complétée selon les cookies et technologies réellement
          utilisés par le site.
        </p>
      </LegalSection>

      <LegalSection title="Préférences">
        <p>
          Aucun mécanisme ou fournisseur de consentement n’est inventé à ce
          stade.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
