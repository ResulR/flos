import { createFileRoute } from '@tanstack/react-router'

import {
  LegalPage,
  LegalPending,
  LegalSection,
} from '@/components/legal/legal-page'

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

        <LegalPending>
          Renseigner la dénomination ou le nom légal de l’éditeur, sa forme
          juridique, son numéro d’entreprise, son numéro de TVA le cas échéant,
          son siège ou adresse légale et le représentant responsable.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Coordonnées">
        <p>
          Les coordonnées publiques de Flo&apos;s Bikes sont administrées depuis
          les paramètres du site et affichées sur la page Contact lorsqu’elles
          sont configurées.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <LegalPending>
          Renseigner l’identité légale de l’hébergeur ainsi que les informations
          de contact qui doivent apparaître sur le site.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Responsabilité et propriété intellectuelle">
        <LegalPending>
          Faire compléter les mentions relatives à la responsabilité de
          l’éditeur, aux contenus du site, aux marques, photographies et autres
          éléments protégés.
        </LegalPending>
      </LegalSection>
    </LegalPage>
  )
}
