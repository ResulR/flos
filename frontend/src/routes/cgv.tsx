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
          Flo&apos;s Bikes propose à la vente des vélos d’occasion présentés
          individuellement sur le site.
        </p>

        <p>
          <strong>À compléter avant production :</strong> identité juridique du
          vendeur et champ d’application définitif des présentes conditions.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilité et prix">
        <p>
          Les informations affichées dans le navigateur ne constituent pas la
          source définitive concernant le prix ou la disponibilité d’un vélo.
          Avant un checkout, le serveur recharge les produits concernés et
          vérifie leur prix ainsi que leur disponibilité.
        </p>

        <p>
          Si un vélo nécessaire à la commande n’est plus disponible, l’opération
          ne peut pas être finalisée.
        </p>
      </LegalSection>

      <LegalSection title="Réservation">
        <p>
          Une réservation concerne un seul vélo et ne peut être créée que si ce
          vélo est encore disponible. Sa durée est comprise entre un et trois
          jours.
        </p>

        <p>
          Une réservation active bloque le vélo concerné. À son expiration, le
          vélo peut redevenir disponible s’il n’a pas été vendu ou masqué entre
          temps.
        </p>
      </LegalSection>

      <LegalSection title="Commande">
        <p>
          Une commande peut contenir plusieurs vélos différents. Lors de la
          création du checkout, les vélos sont à nouveau vérifiés côté serveur
          et temporairement bloqués pendant l’attente du paiement.
        </p>

        <p>
          Si le checkout expire, est abandonné ou si le paiement échoue
          définitivement, les vélos encore bloqués par cette commande peuvent
          redevenir disponibles.
        </p>
      </LegalSection>

      <LegalSection title="Paiement">
        <p>
          Le paiement en ligne prévu en V1 utilise Stripe Checkout. Le retour du
          navigateur après paiement n’est pas considéré à lui seul comme une
          confirmation définitive.
        </p>

        <p>
          La confirmation du paiement est traitée côté serveur à partir d’un
          événement Stripe vérifié.
        </p>
      </LegalSection>

      <LegalSection title="Livraison et retrait">
        <p>
          Le système prévoit la livraison ainsi que le retrait. Les frais de
          livraison sont configurables dans les paramètres du site.
        </p>

        <p>
          <strong>À compléter avant production :</strong> zones desservies,
          délais indicatifs ou contractuels, conditions de retrait, transporteur
          éventuel et autres modalités de livraison applicables.
        </p>
      </LegalSection>

      <LegalSection title="Rétractation, retours et garanties">
        <p>
          <strong>À compléter et faire valider avant production :</strong>{' '}
          conditions de rétractation, retours, remboursements, garanties légales
          ou commerciales et procédure de réclamation.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable et litiges">
        <p>
          <strong>À compléter avant production :</strong> droit applicable,
          juridiction compétente et éventuelles procédures de médiation ou de
          règlement extrajudiciaire.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
