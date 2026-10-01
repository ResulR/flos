import { AlertTriangle } from 'lucide-react'

import { PublicPage } from '@/components/layout/public-page'

type LegalPageProps = {
  eyebrow: string
  title: string
  children: React.ReactNode
}

export function LegalPage({ eyebrow, title, children }: LegalPageProps) {
  return (
    <PublicPage>
      <section className="border-b border-black/8 bg-[#f7f5f1]">
        <div className="site-container py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#b44a42]">
            {eyebrow}
          </p>

          <h1 className="mt-4 max-w-5xl font-[Georgia,'Times_New_Roman',serif] text-[clamp(3rem,6vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.055em] text-[#171717]">
            {title}
          </h1>
        </div>
      </section>

      <article className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <div className="max-w-3xl space-y-12">{children}</div>
        </div>
      </article>
    </PublicPage>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-black/8 pb-12 last:border-b-0 last:pb-0">
      <h2 className="font-[Georgia,'Times_New_Roman',serif] text-2xl font-normal tracking-[-0.03em] text-[#171717] sm:text-3xl">
        {title}
      </h2>

      <div className="mt-5 space-y-4 text-[0.98rem] font-light leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export function LegalPending({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950 ring-1 ring-amber-100">
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-amber-700"
      />

      <div>
        <strong className="font-medium">
          À compléter avant mise en production.
        </strong>{' '}
        {children}
      </div>
    </div>
  )
}
