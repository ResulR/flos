import { createFileRoute } from '@tanstack/react-router'

import {
  LegalPage,
  LegalPending,
  LegalSection,
} from '@/components/legal/legal-page'

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  return (
    <LegalPage eyebrow="Informations légales" title="Politique de cookies">
      <LegalSection title="Stockage utilisé par le site">
        <p>
          Le panier public est conservé dans le navigateur afin de permettre à
          l’utilisateur de retrouver sa sélection sans créer de compte client.
        </p>

        <p>
          L’espace d’administration utilise également un cookie de session
          destiné à authentifier l’administrateur.
        </p>
      </LegalSection>

      <LegalSection title="Services supplémentaires">
        <p>
          Aucun fournisseur de publicité, outil d’analyse ou mécanisme de
          consentement supplémentaire n’est actuellement documenté comme actif
          sur le site.
        </p>

        <LegalPending>
          Vérifier l’inventaire définitif des cookies, stockages navigateur,
          outils de mesure et services tiers réellement chargés avant la mise en
          production publique.
        </LegalPending>
      </LegalSection>

      <LegalSection title="Gestion des préférences">
        <p>
          Si des technologies nécessitant un consentement sont ajoutées
          ultérieurement, un mécanisme adapté devra permettre à l’utilisateur
          d’accepter, refuser ou modifier ses préférences.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
