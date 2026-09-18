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
          Selon l’action réalisée sur le site, Flo&apos;s Bikes prévoit de
          traiter notamment les coordonnées communiquées par le client, les
          informations nécessaires à une commande ou à une livraison, ainsi que
          les informations fournies lors d’une réservation ou d’une demande de
          reprise.
        </p>

        <p>
          Une demande de reprise peut également contenir des informations sur le
          vélo et une ou plusieurs photographies.
        </p>
      </LegalSection>

      <LegalSection title="Finalités">
        <p>
          Ces données sont utilisées dans le fonctionnement prévu du service :
          gestion des réservations, commandes, paiements, livraisons ou retraits
          et demandes de reprise.
        </p>
      </LegalSection>

      <LegalSection title="Paiement">
        <p>
          Les paiements en ligne prévus par le site utilisent Stripe Checkout.
          Le système conserve les références nécessaires au suivi du paiement et
          traite la confirmation côté serveur.
        </p>
      </LegalSection>

      <LegalSection title="Conservation">
        <p>
          Certaines informations métier sont conservées afin d’assurer
          l’historique des réservations, commandes et paiements.
        </p>

        <p>
          <strong>À compléter avant production :</strong> durées précises de
          conservation pour chaque catégorie de données et règles définitives de
          suppression ou d’archivage.
        </p>
      </LegalSection>

      <LegalSection title="Responsable et destinataires">
        <p>
          <strong>À compléter avant production :</strong> identité et
          coordonnées du responsable du traitement, destinataires ou
          sous-traitants concernés et informations requises concernant les
          transferts éventuels de données.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          <strong>À compléter avant production :</strong> droits applicables,
          procédure permettant de les exercer, adresse de contact dédiée et
          autorité de contrôle compétente.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
