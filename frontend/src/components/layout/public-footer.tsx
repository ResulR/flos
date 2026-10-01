type PublicFooterProps = {
  phone?: string | null
  email?: string | null
  address?: string | null
}

const navigation = [
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Reprise', href: '/reprise' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

const legalLinks = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Cookies', href: '/cookies' },
]

export function PublicFooter({ phone, email, address }: PublicFooterProps) {
  return (
    <footer className="bg-[#171717] text-white">
      <div className="site-container py-14 sm:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:gap-16">
          <div>
            <img
              src="/flos-bikes-logo.png"
              alt="Flo's Bikes"
              className="h-11 w-auto rounded-sm bg-white p-1.5 object-contain"
            />

            <p className="mt-6 max-w-sm font-[Georgia,'Times_New_Roman',serif] text-2xl font-normal leading-snug tracking-[-0.03em] text-white/90">
              Des vélos de seconde main,
              <br />
              présentés simplement.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">
              Navigation
            </p>

            <nav
              aria-label="Navigation secondaire"
              className="mt-5 flex flex-col items-start gap-3"
            >
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-light text-white/65 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">
              Contact
            </p>

            <div className="mt-5 flex flex-col items-start gap-3">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="text-sm font-light text-white/65 transition-colors hover:text-white"
                >
                  {phone}
                </a>
              ) : null}

              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="break-all text-sm font-light text-white/65 transition-colors hover:text-white"
                >
                  {email}
                </a>
              ) : null}

              {address ? (
                <span className="text-sm font-light text-white/65">
                  {address}
                </span>
              ) : null}

              {!phone && !email && !address ? (
                <span className="text-sm font-light text-white/45">
                  Coordonnées disponibles prochainement.
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-light text-white/40">
              © {new Date().getFullYear()} Flo&apos;s Bikes
            </p>

            <nav
              aria-label="Informations légales"
              className="flex flex-wrap gap-x-5 gap-y-3"
            >
              {legalLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-xs font-light text-white/40 transition-colors hover:text-white/80"
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
