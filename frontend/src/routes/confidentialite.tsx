import { createFileRoute } from '@tanstack/react-router'

import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const Route = createFileRoute('/confidentialite')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Politique de confidentialité"
    >
      <LegalSection title="Données traitées">
        <p>
          Les catégories réelles de données personnelles seront documentées
          lorsque les traitements backend seront finalisés.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Les coordonnées et procédures applicables seront ajoutées à partir des
          informations juridiques réelles de l’entreprise.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
