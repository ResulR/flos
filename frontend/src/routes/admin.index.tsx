import { createFileRoute } from '@tanstack/react-router'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { ApiClientError, apiRequest } from '@/lib/api'

export const Route = createFileRoute('/admin/')({
  component: AdminLoginPage,
})

type AdminLoginResponse = {
  authenticated: true
}

type AdminLoginFieldErrors = Partial<Record<'email' | 'password', string>>

function AdminLoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<AdminLoginFieldErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const formData = new FormData(event.currentTarget)

    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    try {
      await apiRequest<AdminLoginResponse>('/admin/auth/login', {
        method: 'POST',
        body: {
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        },
      })

      window.location.assign('/admin/dashboard')
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'VALIDATION_ERROR') {
          setFieldErrors({
            email: error.fields?.['body.email'],
            password: error.fields?.['body.password'],
          })

          setSubmitError('Vérifiez les informations saisies.')
        } else if (error.code === 'UNAUTHENTICATED') {
          setSubmitError('Email ou mot de passe incorrect.')
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError('Impossible de vous connecter pour le moment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-brand-gray-50 lg:grid-cols-2">
      <section className="hidden overflow-hidden bg-brand-black text-brand-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/flos-bikes-logo.png"
          alt="Flo's Bikes"
          className="h-12 w-auto self-start bg-white object-contain"
        />

        <div>
          <p className="type-label uppercase tracking-[0.16em] text-brand-red">
            Administration
          </p>

          <h1 className="type-display mt-4 max-w-xl">
            Gérer Flo&apos;s Bikes simplement.
          </h1>
        </div>

        <p className="type-secondary text-brand-gray-400">
          Accès réservé à l’administrateur.
        </p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <img
              src="/flos-bikes-logo.png"
              alt="Flo's Bikes"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="mt-10 lg:mt-0">
            <div className="flex size-11 items-center justify-center rounded-md bg-brand-black text-brand-white">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </div>

            <h1 className="type-heading-2 mt-6">Connexion</h1>

            <p className="type-body mt-3 text-muted-foreground">
              Utilisez le compte administrateur configuré pour accéder à la
              gestion du site.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={isSubmitting}
              error={fieldErrors.email}
            />

            <TextField
              label="Mot de passe"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              error={fieldErrors.password}
            />

            {submitError ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {submitError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
