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
          Le site Flo&apos;s Bikes présente et commercialise des vélos
          d’occasion.
        </p>

        <p>
          <strong>À compléter avant production :</strong> dénomination ou nom
          légal de l’éditeur, forme juridique, numéro d’entreprise, numéro de
          TVA le cas échéant, siège ou adresse légale et représentant
          responsable.
        </p>
      </LegalSection>

      <LegalSection title="Coordonnées">
        <p>
          Les coordonnées de contact publiques de Flo&apos;s Bikes sont
          administrées depuis les paramètres du site et sont affichées sur la
          page Contact lorsqu’elles sont configurées.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          <strong>À compléter avant production :</strong> identité légale,
          adresse et coordonnées requises de l’hébergeur du service.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité et propriété intellectuelle">
        <p>
          <strong>À compléter avant production :</strong> mentions relatives à
          la responsabilité de l’éditeur, aux contenus du site, aux marques,
          photographies et autres éléments protégés.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
