import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import {
  Bike,
  ClipboardList,
  Gauge,
  HandCoins,
  LogOut,
  Menu,
  PackageCheck,
  Settings,
  X,
} from 'lucide-react'
import { useState } from 'react'

import { apiRequest } from '@/lib/api'

const navigation = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: Gauge,
  },
  {
    label: 'Produits',
    href: '/admin/produits',
    icon: Bike,
  },
  {
    label: 'Commandes',
    href: '/admin/commandes',
    icon: PackageCheck,
  },
  {
    label: 'Réservations',
    href: '/admin/reservations',
    icon: ClipboardList,
  },
  {
    label: 'Reprises',
    href: '/admin/reprises',
    icon: HandCoins,
  },
  {
    label: 'Paramètres',
    href: '/admin/parametres',
    icon: Settings,
  },
]

export function AdminShell({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await apiRequest<{ authenticated: false }>('/admin/auth/logout', {
        method: 'POST',
      })

      window.location.assign('/admin/')
    } catch {
      setLogoutError(
        'Impossible de vous déconnecter pour le moment. Réessayez.',
      )
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-gray-50 text-foreground lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden min-h-screen border-r border-border bg-brand-black text-brand-white lg:block">
        <div className="sticky top-0">
          <div className="border-b border-brand-gray-800 px-6 py-6">
            <img
              src="/flos-bikes-logo.png"
              alt="Flo's Bikes"
              className="h-10 w-auto bg-white object-contain"
            />
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-brand-gray-400">
              Administration
            </p>
          </div>

          <AdminNavigation />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-border bg-background">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
            <div>
              {eyebrow ? (
                <p className="type-label uppercase tracking-[0.12em] text-primary">
                  {eyebrow}
                </p>
              ) : null}

              <h1 className="mt-1 text-2xl font-medium leading-tight">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">Administrateur</p>
                <p className="text-xs text-muted-foreground">
                  Compte unique V1
                </p>
              </div>

              {logoutError ? (
                <p
                  role="alert"
                  className="hidden max-w-52 text-right text-xs text-destructive md:block"
                >
                  {logoutError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <LogOut aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">
                  {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
                </span>
              </button>

              <button
                type="button"
                aria-label={
                  mobileOpen
                    ? 'Fermer la navigation administrateur'
                    : 'Ouvrir la navigation administrateur'
                }
                aria-expanded={mobileOpen}
                aria-controls="admin-mobile-navigation"
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex size-11 items-center justify-center rounded-md border border-border lg:hidden"
              >
                {mobileOpen ? (
                  <X aria-hidden="true" className="size-5" />
                ) : (
                  <Menu aria-hidden="true" className="size-5" />
                )}
              </button>
            </div>
          </div>

          {mobileOpen ? (
            <div
              id="admin-mobile-navigation"
              className="border-t border-border bg-brand-black text-brand-white lg:hidden"
            >
              <AdminNavigation onNavigate={() => setMobileOpen(false)} />
            </div>
          ) : null}
        </header>

        <main className="p-5 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  )
}

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <nav aria-label="Navigation administrateur" className="space-y-1 p-4">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-charcoal text-brand-white'
                : 'text-brand-gray-400 hover:bg-brand-charcoal hover:text-brand-white',
            ].join(' ')}
          >
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
