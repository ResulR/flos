import { createFileRoute } from '@tanstack/react-router'

import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const Route = createFileRoute('/cgv')({
  component: TermsPage,
})

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Conditions générales de vente"
    >
      <LegalSection title="Objet">
        <p>
          Le texte définitif des conditions générales de vente devra être fourni
          ou validé avant la mise en production.
        </p>
      </LegalSection>

      <LegalSection title="Commande et paiement">
        <p>
          Cette section accueillera les règles réelles relatives à la commande,
          au paiement, à la livraison ou au retrait.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
