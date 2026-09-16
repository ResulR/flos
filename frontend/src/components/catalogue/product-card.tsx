import { ArrowUpRight } from 'lucide-react'

export type ProductCardStatus = 'available' | 'reserved' | 'sold'

type ProductCardProps = {
  href: string
  imageSrc?: string | null
  brand: string
  model: string
  priceLabel: string
  condition: string
  status: ProductCardStatus
  reservedUntil?: string | null
}

const statusLabels: Record<ProductCardStatus, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
}

export function ProductCard({
  href,
  imageSrc,
  brand,
  model,
  priceLabel,
  condition,
  status,
  reservedUntil,
}: ProductCardProps) {
  return (
    <article className="group">
      <a
        href={href}
        className="block rounded-xl"
        aria-label={`${brand} ${model}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-gray-100">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`${brand} ${model}`}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-light text-muted-foreground">
              Photo du vélo
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span
              className={[
                'inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-medium',
                status === 'available'
                  ? 'bg-brand-white text-brand-black'
                  : status === 'reserved'
                    ? 'bg-brand-black text-brand-white'
                    : 'bg-brand-gray-600 text-brand-white',
              ].join(' ')}
            >
              {status === 'reserved' && reservedUntil
                ? `Réservé jusqu’au ${reservedUntil}`
                : statusLabels[status]}
            </span>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                {brand}
              </p>

              <h3 className="type-product-title mt-1">{model}</h3>
            </div>

            <ArrowUpRight
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            />
          </div>

          <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-4">
            <p className="type-price">{priceLabel}</p>

            <p className="type-secondary text-right text-muted-foreground">
              {condition}
            </p>
          </div>
        </div>
      </a>
    </article>
  )
}
