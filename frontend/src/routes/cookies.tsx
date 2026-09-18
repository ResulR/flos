import { createFileRoute } from '@tanstack/react-router'

import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const Route = createFileRoute('/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  return (
    <LegalPage eyebrow="Informations légales" title="Politique de cookies">
      <LegalSection title="Stockage utilisé par le site">
        <p>
          Le panier public est prévu pour être conservé côté navigateur et ne
          nécessite pas de compte client.
        </p>

        <p>
          L’espace d’administration prévoit également un cookie de session
          sécurisé, utilisé pour authentifier l’administrateur.
        </p>
      </LegalSection>

      <LegalSection title="Cookies et technologies supplémentaires">
        <p>
          Aucun fournisseur de publicité, outil d’analyse ou mécanisme de
          consentement supplémentaire n’est documenté comme actif à ce stade du
          projet.
        </p>

        <p>
          <strong>À vérifier avant production :</strong> inventaire définitif
          des cookies, stockages navigateur, outils de mesure ou services tiers
          réellement chargés par le site.
        </p>
      </LegalSection>

      <LegalSection title="Préférences">
        <p>
          <strong>À compléter si nécessaire avant production :</strong>{' '}
          mécanisme de gestion du consentement et procédure permettant de
          modifier les préférences lorsque des technologies nécessitant un
          consentement seront effectivement utilisées.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
