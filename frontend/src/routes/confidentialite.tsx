import { createFileRoute } from '@tanstack/react-router'

import {
  LegalPage,
  LegalPending,
  LegalSection,
} from '@/components/legal/legal-page'

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
          Selon l’action réalisée sur le site, Flo&apos;s Bikes traite notamment
          les coordonnées communiquées par le client, les informations
          nécessaires à une commande ou à une livraison ainsi que les
          informations fournies lors d’une réservation ou d’une demande de
          reprise.
        </p>

        <p>
          Une demande de reprise peut également contenir des informations sur le
          vélo et jusqu’à plusieurs photographies envoyées par l’utilisateur.
        </p>
      </LegalSection>

      <LegalSection title="Finalités">
        <p>
          Ces données servent au fonctionnement du service : gestion des
          réservations, commandes, livraisons ou retraits, demandes de reprise
          et échanges nécessaires avec le client.
        </p>
      </LegalSection>

      <LegalSection title="Paiement">
        <p>
          Le site prévoit des informations de suivi liées au paiement des
          commandes. À ce stade, aucun paiement en ligne n’est encore activé sur
          le parcours public.
        </p>

        <LegalPending>
          Adapter cette section lorsque le prestataire et le fonctionnement
          définitif du paiement en ligne auront été choisis et activés.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Conservation">
        <p>
          Certaines informations métier sont conservées afin d’assurer le suivi
          et l’historique des réservations, commandes et demandes de reprise.
        </p>

        <LegalPending>
          Définir les durées de conservation précises pour chaque catégorie de
          données ainsi que les règles de suppression ou d’archivage.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Responsable et destinataires">
        <LegalPending>
          Renseigner l’identité et les coordonnées du responsable du traitement,
          les destinataires ou sous-traitants concernés et, si nécessaire, les
          informations relatives aux transferts de données.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Vos droits">
        <LegalPending>
          Décrire les droits applicables, la procédure permettant de les
          exercer, l’adresse de contact dédiée et l’autorité de contrôle
          compétente.
        </LegalPending>
      </LegalSection>
    </LegalPage>
  )
}
