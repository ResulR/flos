import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  readStoredCart,
  sanitizeCartItems,
  writeStoredCart,
  type CartItem,
} from './cart-storage'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  isHydrated: boolean
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setItems(readStoredCart())
      setIsHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    writeStoredCart(items)
  }, [isHydrated, items])

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      isHydrated,
      addItem: (productId: string) => {
        setItems((currentItems) =>
          sanitizeCartItems([
            ...currentItems,
            {
              productId,
              quantity: 1,
            },
          ]),
        )
      },
      removeItem: (productId: string) => {
        setItems((currentItems) =>
          currentItems.filter((item) => item.productId !== productId),
        )
      },
      clearCart: () => {
        setItems([])
      },
    }),
    [items, isHydrated],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
