import { useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'

import { useCart } from '@/features/cart/cart-context'

const navigation = [
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Reprise', href: '/reprise' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

export type PublicHeaderVariant = 'default' | 'overlay'

type PublicHeaderProps = {
  variant?: PublicHeaderVariant
}

export function PublicHeader({ variant = 'default' }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, isHydrated } = useCart()
  const displayedItemCount = isHydrated ? itemCount : 0
  const isOverlay = variant === 'overlay'

  return (
    <header
      className={
        isOverlay
          ? 'absolute inset-x-0 top-0 z-50 border-b border-white/15 bg-black/10 text-white backdrop-blur-[2px]'
          : 'border-b border-border bg-background'
      }
    >
      <div className="site-container flex h-20 items-center justify-between gap-8">
        <a href="/" aria-label="Flo's Bikes — Accueil" className="shrink-0">
          <img
            src="/flos-bikes-logo.png"
            alt="Flo's Bikes"
            className={
              isOverlay
                ? 'h-11 w-auto rounded-sm bg-white/95 p-1.5 object-contain shadow-sm'
                : 'h-12 w-auto object-contain'
            }
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
              className={
                isOverlay
                  ? 'type-label relative py-2 text-white/90 transition-colors hover:text-white focus-visible:text-white'
                  : 'type-label relative py-2 text-foreground transition-colors hover:text-primary focus-visible:text-primary'
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/panier"
            aria-label={`Panier, ${displayedItemCount} ${
              displayedItemCount > 1 ? 'articles' : 'article'
            }`}
            className={
              isOverlay
                ? 'relative inline-flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10'
                : 'relative inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-muted'
            }
          >
            <ShoppingBag
              aria-hidden="true"
              className="size-5"
              strokeWidth={1.8}
            />

            <span
              className={
                isOverlay
                  ? 'absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#b44a42] px-1 text-[10px] font-medium leading-none text-white'
                  : 'absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-none text-primary-foreground'
              }
            >
              {displayedItemCount}
            </span>
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className={
              isOverlay
                ? 'inline-flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden'
                : 'inline-flex size-11 items-center justify-center rounded-md transition-colors hover:bg-muted lg:hidden'
            }
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
          className={
            isOverlay
              ? 'border-t border-white/10 bg-[#171717]/95 text-white backdrop-blur-xl lg:hidden'
              : 'border-t border-border bg-background lg:hidden'
          }
        >
          <div className="site-container flex flex-col py-3">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={
                  isOverlay
                    ? 'flex min-h-12 items-center border-b border-white/10 py-3 text-base font-medium last:border-b-0'
                    : 'flex min-h-12 items-center border-b border-border/70 py-3 text-base font-medium last:border-b-0'
                }
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
