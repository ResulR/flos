import { createFileRoute } from '@tanstack/react-router'

import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const Route = createFileRoute('/mentions-legales')({
  component: LegalNoticePage,
})

function LegalNoticePage() {
  return (
    <LegalPage eyebrow="Informations légales" title="Mentions légales">
      <LegalSection title="Éditeur du site">
        <p>
          Les informations juridiques réelles de l’entreprise seront insérées
          ici avant la mise en production.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Les informations relatives à l’hébergeur seront complétées à partir
          des données réelles du projet.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
