type PublicFooterProps = {
  phone?: string | null
  email?: string | null
  address?: string | null
}

const navigation = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

const legalLinks = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Conditions générales de vente', href: '/cgv' },
  { label: 'Politique de confidentialité', href: '/confidentialite' },
  { label: 'Politique de cookies', href: '/cookies' },
]

export function PublicFooter({ phone, email, address }: PublicFooterProps) {
  return (
    <footer className="mt-16 bg-brand-black text-brand-white">
      <div className="site-container py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <img
              src="/flos-bikes-logo.png"
              alt="Flo's Bikes"
              className="h-12 w-auto bg-white object-contain"
            />

            <p className="type-secondary mt-5 max-w-xs text-brand-gray-400">
              Vélos de seconde main sélectionnés avec soin.
            </p>
          </div>

          <div>
            <p className="type-label mb-4 text-brand-white">Navigation</p>

            <nav
              aria-label="Navigation secondaire"
              className="flex flex-col items-start gap-3"
            >
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="type-secondary text-brand-gray-400 transition-colors hover:text-brand-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <p className="type-label mb-4 text-brand-white">Contact</p>

            <div className="flex flex-col items-start gap-3">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="type-secondary text-brand-gray-400 transition-colors hover:text-brand-white"
                >
                  {phone}
                </a>
              ) : null}

              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="type-secondary text-brand-gray-400 transition-colors hover:text-brand-white"
                >
                  {email}
                </a>
              ) : null}

              {address ? (
                <span className="type-secondary text-brand-gray-400">
                  {address}
                </span>
              ) : null}

              {!phone && !email && !address ? (
                <span className="type-secondary text-brand-gray-400">
                  Coordonnées disponibles prochainement.
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-gray-800 pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="type-secondary text-brand-gray-400">
              © {new Date().getFullYear()} Flo&apos;s Bikes
            </p>

            <nav
              aria-label="Informations légales"
              className="flex flex-wrap gap-x-6 gap-y-3"
            >
              {legalLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-light text-brand-gray-400 transition-colors hover:text-brand-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
