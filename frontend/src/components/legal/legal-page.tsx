import { PublicPage } from '@/components/layout/public-page'

type LegalPageProps = {
  eyebrow: string
  title: string
  children: React.ReactNode
}

export function LegalPage({
  eyebrow,
  title,
  children,
}: LegalPageProps) {
  return (
    <PublicPage>
      <section className="border-b border-border bg-brand-gray-50">
        <div className="site-container py-12 lg:py-16">
          <p className="type-label uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h1 className="type-display mt-3">{title}</h1>
        </div>
      </section>

      <article className="site-container py-12 lg:py-16">
        <div className="max-w-3xl space-y-10">
          {children}
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
    <section>
      <h2 className="type-heading-3">{title}</h2>
      <div className="type-body mt-4 space-y-4 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}
