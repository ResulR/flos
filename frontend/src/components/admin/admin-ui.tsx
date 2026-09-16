import type { ReactNode } from 'react'

export function AdminPanel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          {description ? (
            <p className="type-secondary mt-1 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {action}
      </div>

      {children}
    </section>
  )
}

export function MetricCard({
  label,
  value = '—',
  detail,
}: {
  label: string
  value?: string
  detail?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="type-secondary text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-medium tracking-tight">{value}</p>

      {detail ? (
        <p className="type-secondary mt-2 text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  )
}

export function AdminField({
  label,
  name,
  type = 'text',
  placeholder,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="type-label mb-2 block">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="form-control w-full"
      />
    </label>
  )
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'positive' | 'warning'
}) {
  const classes = {
    neutral: 'bg-brand-gray-100 text-brand-gray-800',
    positive: 'bg-brand-black text-brand-white',
    warning: 'bg-primary text-primary-foreground',
  }

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-medium ${classes[tone]}`}
    >
      {children}
    </span>
  )
}
