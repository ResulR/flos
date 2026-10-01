import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import { ProductCard } from '@/components/catalogue/product-card'
import { FlowState } from '@/components/feedback/flow-state'
import { PublicPage } from '@/components/layout/public-page'
import { apiRequest } from '@/lib/api'

export const Route = createFileRoute('/')({ component: Home })

type HomeProduct = {
  id: string
  brand: string
  model: string
  priceCents: string
  condition: string
  status: 'available' | 'reserved' | 'sold'
  imageUrl: string | null
}

function formatPrice(priceCents: string) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(priceCents) / 100)
}

function Home() {
  const [products, setProducts] = useState<HomeProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      try {
        const data = await apiRequest<HomeProduct[]>(
          '/products?availability=available&sort=recent',
        )

        if (!cancelled) {
          setProducts(data.slice(0, 3))
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger la sélection de vélos.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PublicPage headerVariant="overlay">
      <section className="home-hero relative isolate overflow-hidden text-white">
        <img
          src="/home/hero-workshop.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />

        <div className="home-hero-scrim absolute inset-0 -z-10" />

        <div className="site-container flex min-h-[44rem] items-end pb-14 pt-36 sm:min-h-[48rem] sm:pb-16 lg:min-h-[min(54rem,100svh)] lg:pb-20 lg:pt-40">
          <div className="max-w-4xl">
            <p className="home-hero-enter type-label uppercase tracking-[0.2em] text-[#e0b0ac]">
              Flo&apos;s Bikes · Paris
            </p>

            <h1 className="home-display home-hero-enter home-hero-enter-delay mt-5 max-w-4xl text-white">
              Des vélos qui méritent
              <span className="home-display-accent block">
                une deuxième route.
              </span>
            </h1>

            <p className="home-hero-enter home-hero-enter-delay-2 mt-7 max-w-2xl text-base font-light leading-relaxed text-white/78 sm:text-lg">
              Vélos d&apos;occasion sélectionnés, présentés clairement et prêts
              à repartir. Une expérience simple pour acheter ou faire reprendre
              votre vélo.
            </p>

            <div className="home-hero-enter home-hero-enter-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/catalogue"
                className="group type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#b44a42] px-7 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#9d4039]"
              >
                Découvrir les vélos
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

              <a
                href="/reprise"
                className="type-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/45 bg-white/5 px-7 text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/10"
              >
                Faire reprendre mon vélo
              </a>
            </div>

            <div className="home-hero-enter home-hero-enter-delay-3 mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/20 pt-5 text-sm font-light text-white/65">
              <span>Vélos de seconde main</span>
              <span>Sélection claire</span>
              <span>Reprise simple</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5f1] py-20 sm:py-24 lg:py-32">
        <div className="site-container">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-label uppercase tracking-[0.2em] text-[#b44a42]">
                En ce moment
              </p>

              <h2 className="home-section-title mt-4">
                Les vélos chez Flo&apos;s.
              </h2>
            </div>

            <a
              href="/catalogue"
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-[#b44a42]"
            >
              Voir tout le catalogue
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>

          <div className="mt-12 lg:mt-16">
            {isLoading ? (
              <FlowState
                kind="loading"
                title="Chargement de la sélection"
                description="Les vélos disponibles sont en cours de chargement."
              />
            ) : error ? (
              <FlowState
                kind="error"
                title="Sélection indisponible"
                description={error}
              />
            ) : products.length === 0 ? (
              <FlowState
                kind="empty"
                title="Aucun vélo disponible pour le moment"
                description="De nouveaux vélos seront ajoutés au catalogue dès qu’ils seront disponibles."
              />
            ) : (
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    href={`/produits/${product.id}`}
                    variant="editorial"
                    imageSrc={product.imageUrl}
                    brand={product.brand}
                    model={product.model}
                    priceLabel={formatPrice(product.priceCents)}
                    condition={product.condition}
                    status={product.status}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#b44a42] text-white">
        <div className="site-container grid gap-14 py-20 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-24 lg:py-28">
          <div>
            <p className="type-label uppercase tracking-[0.2em] text-white/65">
              Vous avez déjà un vélo ?
            </p>

            <h2 className="home-reprise-title mt-5 max-w-3xl">
              Donnez-lui une
              <span className="block italic text-white/78">
                nouvelle route.
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-base font-light leading-relaxed text-white/75">
              Quelques informations et quelques photos suffisent pour commencer.
              Nous revenons ensuite vers vous pour la suite.
            </p>

            <a
              href="/reprise"
              className="group mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-medium text-[#171717] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f7f5f1]"
            >
              Faire reprendre mon vélo
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>

          <div className="border-t border-white/25">
            <RepriseStep
              number="01"
              title="Envoyez votre demande"
              text="Ajoutez les informations que vous connaissez sur votre vélo."
            />

            <RepriseStep
              number="02"
              title="Ajoutez quelques photos"
              text="Elles nous permettent de mieux comprendre son état."
            />

            <RepriseStep
              number="03"
              title="Nous vous recontactons"
              text="La suite se fait directement avec vous, simplement."
            />
          </div>
        </div>
      </section>
    </PublicPage>
  )
}

function RepriseStep({
  number,
  title,
  text,
}: {
  number: string
  title: string
  text: string
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-white/25 py-6 sm:grid-cols-[3.25rem_1fr]">
      <span className="text-xs font-medium tracking-[0.12em] text-white/55">
        {number}
      </span>

      <div>
        <h3 className="text-lg font-medium tracking-[-0.015em] text-white">
          {title}
        </h3>

        <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-white/65">
          {text}
        </p>
      </div>
    </div>
  )
}
