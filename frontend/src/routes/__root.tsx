import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { CartProvider } from '@/features/cart/cart-context'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: "Flo's Bikes — Vélos d'occasion",
      },
      {
        name: 'description',
        content:
          'Découvrez les vélos d’occasion proposés par Flo’s Bikes, réservez votre vélo ou envoyez une demande de reprise.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>

        <Scripts />
      </body>
    </html>
  )
}
