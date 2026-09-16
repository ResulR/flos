import { createFileRoute } from '@tanstack/react-router'

import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <>
      <PublicHeader />

      <main className="site-container section-space">
        <p className="type-secondary">Flo&apos;s Bikes</p>
        <h1 className="type-display mt-3 max-w-3xl">
          Vélos de seconde main.
        </h1>
      </main>

      <PublicFooter />
    </>
  )
}
