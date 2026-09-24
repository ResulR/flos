import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

type AdminSessionResponse = {
  authenticated: true
}

type SessionCheckState = 'checking' | 'authenticated' | 'error'

function AdminLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isLoginRoute = pathname === '/admin' || pathname === '/admin/'

  if (isLoginRoute) {
    return <Outlet />
  }

  return <AdminSessionGuard key={pathname} />
}

function AdminSessionGuard() {
  const [state, setState] = useState<SessionCheckState>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      setState('checking')

      try {
        await apiRequest<AdminSessionResponse>('/admin/auth/session')

        if (!cancelled) {
          setState('authenticated')
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        if (
          error instanceof ApiClientError &&
          error.code === 'UNAUTHENTICATED'
        ) {
          window.location.replace('/admin/')
          return
        }

        setState('error')
      }
    }

    void checkSession()

    return () => {
      cancelled = true
    }
  }, [attempt])

  if (state === 'authenticated') {
    return <Outlet />
  }

  if (state === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-gray-50 p-5">
        <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-medium">
            Impossible de vérifier la session
          </h1>

          <p className="type-secondary mt-3 text-muted-foreground">
            Vérifiez votre connexion puis réessayez.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Réessayer
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-gray-50">
      <div
        role="status"
        className="flex items-center gap-3 text-sm text-muted-foreground"
      >
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        Vérification de la session…
      </div>
    </main>
  )
}
