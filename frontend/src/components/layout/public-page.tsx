import type { ReactNode } from 'react'

import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'

export type PublicContactDetails = {
  phone?: string | null
  email?: string | null
  address?: string | null
}

type PublicPageProps = {
  children: ReactNode
  contact?: PublicContactDetails
}

export function PublicPage({ children, contact }: PublicPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">{children}</main>

      <PublicFooter
        phone={contact?.phone}
        email={contact?.email}
        address={contact?.address}
      />
    </div>
  )
}
