import { createFileRoute } from '@tanstack/react-router'

import {
  LegalPage,
  LegalPending,
  LegalSection,
} from '@/components/legal/legal-page'

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
          Flo&apos;s Bikes propose à la vente des vélos d’occasion présentés
          individuellement sur le site.
        </p>

        <LegalPending>
          Renseigner l’identité juridique du vendeur et définir précisément le
          champ d’application des présentes conditions.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Disponibilité et prix">
        <p>
          Chaque vélo correspond à un produit unique. Sa disponibilité et son
          prix sont vérifiés au moment de la création de la commande.
        </p>

        <p>
          Si un vélo n’est plus disponible au moment de la validation, la
          commande correspondante ne peut pas être finalisée avec ce vélo.
        </p>
      </LegalSection>

      <LegalSection title="Réservation">
        <p>
          Une réservation concerne un seul vélo et peut être créée uniquement si
          celui-ci est encore disponible. La durée proposée sur le site est
          comprise entre un et trois jours.
        </p>

        <p>
          Pendant une réservation active, le vélo concerné est marqué comme
          réservé. À son expiration, il peut redevenir disponible s’il n’a pas
          été vendu ou masqué entre-temps.
        </p>
      </LegalSection>

      <LegalSection title="Commande">
        <p>
          Une commande peut contenir plusieurs vélos différents. Leur
          disponibilité et leur prix sont vérifiés au moment de sa création.
        </p>

        <p>
          Une commande nouvellement créée peut rester en attente de paiement
          tant qu’aucun paiement n’a été confirmé.
        </p>
      </LegalSection>

      <LegalSection title="Paiement">
        <p>
          Dans l’état actuel du site, le paiement en ligne n’est pas encore
          activé. La création d’une commande peut donc enregistrer celle-ci avec
          un paiement toujours en attente.
        </p>

        <LegalPending>
          Définir le moyen de paiement réellement proposé en production ainsi
          que ses conditions, son prestataire éventuel et les règles de
          confirmation ou d’échec du paiement.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Livraison et retrait">
        <p>
          Le site prévoit la livraison ainsi que le retrait. Les frais de
          livraison peuvent être configurés depuis les paramètres du site.
        </p>

        <LegalPending>
          Préciser les zones desservies, les délais applicables, les conditions
          de retrait, le transporteur éventuel et les autres modalités de
          livraison.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Rétractation, retours et garanties">
        <LegalPending>
          Faire définir et valider les règles applicables à la rétractation, aux
          retours, remboursements, garanties légales ou commerciales et à la
          procédure de réclamation.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Droit applicable et litiges">
        <LegalPending>
          Renseigner le droit applicable, la juridiction compétente et, lorsque
          cela est requis, les procédures de médiation ou de règlement
          extrajudiciaire.
        </LegalPending>
      </LegalSection>
    </LegalPage>
  )
}
