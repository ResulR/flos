import { useEffect, useState, type ReactNode } from 'react'

import { PublicFooter } from '@/components/layout/public-footer'
import {
  PublicHeader,
  type PublicHeaderVariant,
} from '@/components/layout/public-header'
import { apiRequest } from '@/lib/api'

export type PublicContactDetails = {
  phone: string | null
  email: string | null
  address: string | null
}

type PublicPageProps = {
  children: ReactNode | ((contact: PublicContactDetails | null) => ReactNode)
  headerVariant?: PublicHeaderVariant
}

export function PublicPage({
  children,
  headerVariant = 'default',
}: PublicPageProps) {
  const [contact, setContact] = useState<PublicContactDetails | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadContactDetails() {
      try {
        const data = await apiRequest<PublicContactDetails>(
          '/site-settings/public',
        )

        if (!cancelled) {
          setContact(data)
        }
      } catch {
        if (!cancelled) {
          setContact(null)
        }
      }
    }

    void loadContactDetails()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader variant={headerVariant} />

      <main className="flex-1">
        {typeof children === 'function' ? children(contact) : children}
      </main>

      <PublicFooter
        phone={contact?.phone}
        email={contact?.email}
        address={contact?.address}
      />
    </div>
  )
}
