import { useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'

const navigation = [
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Reprise', href: '/reprise' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-border bg-background">
      <div className="site-container flex h-20 items-center justify-between gap-8">
        <a
          href="/"
          aria-label="Flo's Bikes — Accueil"
          className="shrink-0"
        >
          <img
            src="/flos-bikes-logo.png"
            alt="Flo's Bikes"
            className="h-12 w-auto object-contain"
          />
        </a>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-8 lg:flex"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="type-label relative py-2 text-foreground transition-colors hover:text-primary focus-visible:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/panier"
            aria-label="Panier, 0 article"
            className="relative inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-muted"
          >
            <ShoppingBag aria-hidden="true" className="size-5" strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-none text-primary-foreground">
              0
            </span>
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-muted lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden="true" className="size-6" strokeWidth={1.7} />
            ) : (
              <Menu aria-hidden="true" className="size-6" strokeWidth={1.7} />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="public-mobile-navigation"
          aria-label="Navigation mobile"
          className="border-t border-border bg-background lg:hidden"
        >
          <div className="site-container flex flex-col py-3">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center border-b border-border/70 py-3 text-base font-medium last:border-b-0"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
