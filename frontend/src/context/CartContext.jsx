import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'pswhite_cart';

const parseCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (_error) {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(parseCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item) => {
    setItems((prev) => {
      const index = prev.findIndex(
        (entry) => entry.bookId === item.bookId && entry.format === item.format
      );

      if (index >= 0) {
        const next = [...prev];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + (item.quantity || 1),
        };
        return next;
      }

      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (bookId, format) => {
    setItems((prev) => prev.filter((item) => !(item.bookId === bookId && item.format === format)));
  };

  const updateQuantity = (bookId, format, quantity) => {
    if (quantity <= 0) {
      removeFromCart(bookId, format);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.bookId === bookId && item.format === format ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
