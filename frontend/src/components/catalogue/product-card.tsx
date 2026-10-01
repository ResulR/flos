import { ArrowUpRight } from 'lucide-react'

import { buildApiUrl } from '@/lib/api'

export type ProductCardStatus = 'available' | 'reserved' | 'sold'

type ProductCardProps = {
  href: string
  variant?: 'default' | 'editorial'
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
  variant = 'default',
  imageSrc,
  brand,
  model,
  priceLabel,
  condition,
  status,
  reservedUntil,
}: ProductCardProps) {
  const isEditorial = variant === 'editorial'

  return (
    <article className="group">
      <a href={href} className="block" aria-label={`${brand} ${model}`}>
        <div
          className={[
            'relative overflow-hidden bg-brand-gray-100',
            isEditorial
              ? 'aspect-[5/4] rounded-[1.25rem]'
              : 'aspect-[4/3] rounded-xl',
          ].join(' ')}
        >
          {imageSrc ? (
            <img
              src={buildApiUrl(imageSrc)}
              alt={`${brand} ${model}`}
              className={[
                'size-full object-cover transition-transform',
                isEditorial
                  ? 'duration-500 group-hover:scale-[1.035]'
                  : 'duration-300 group-hover:scale-[1.025]',
              ].join(' ')}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-light text-muted-foreground">
              Photo du vélo
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span
              className={[
                'inline-flex items-center text-xs font-medium',
                isEditorial
                  ? 'min-h-7 rounded-full bg-white/92 px-3 text-brand-black shadow-sm backdrop-blur-sm'
                  : 'min-h-7 rounded-md px-2.5',
                status === 'available'
                  ? isEditorial
                    ? ''
                    : 'bg-brand-white text-brand-black'
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

        <div className={isEditorial ? 'pt-5' : 'pt-4'}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="type-secondary uppercase tracking-[0.08em] text-muted-foreground">
                {brand}
              </p>

              <h3
                className={
                  isEditorial
                    ? 'mt-1 text-[1.45rem] font-medium leading-tight tracking-[-0.02em]'
                    : 'type-product-title mt-1'
                }
              >
                {model}
              </h3>
            </div>

            <ArrowUpRight
              aria-hidden="true"
              className={[
                'mt-1 size-5 shrink-0 text-muted-foreground transition-all duration-300',
                isEditorial
                  ? 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#b44a42]'
                  : 'group-hover:text-primary',
              ].join(' ')}
            />
          </div>

          <div
            className={[
              'flex items-end justify-between gap-4 border-t border-border',
              isEditorial ? 'mt-5 pt-4' : 'mt-4 pt-4',
            ].join(' ')}
          >
            <p
              className={
                isEditorial
                  ? 'text-xl font-medium tracking-[-0.02em]'
                  : 'type-price'
              }
            >
              {priceLabel}
            </p>

            <p className="type-secondary text-right text-muted-foreground">
              {condition}
            </p>
          </div>
        </div>
      </a>
    </article>
  )
}
