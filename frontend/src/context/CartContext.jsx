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

const resolvePrice = (book, format) => {
  if (format === 'ebook') {
    return book.formats?.ebook?.price || 0;
  }
  if (format === 'physical') {
    return book.formats?.physical?.price || 0;
  }
  if (format === 'audiobook') {
    return book.formats?.audiobook?.price || 0;
  }
  return 0;
};

const calculateShipping = (items) => {
  const physicalQuantity = items
    .filter((item) => item.format === 'physical')
    .reduce((sum, item) => sum + item.quantity, 0);

  if (physicalQuantity <= 0) {
    return 0;
  }

  if (physicalQuantity === 1) {
    return 5;
  }

  if (physicalQuantity <= 3) {
    return 8;
  }

  return 12;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(parseCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (book, format = 'ebook', quantity = 1) => {
    if (!book?._id) {
      return;
    }

    if (format === 'physical') {
      const stock = Number(book.formats?.physical?.stock || 0);
      if (stock <= 0) {
        return;
      }
    }

    const itemId = `${book._id}-${format}`;

    setItems((prev) => {
      const existing = prev.find((item) => item.itemId === itemId);
      if (existing) {
        if (format === 'physical') {
          const stock = Number(book.formats?.physical?.stock || 0);
          const nextQuantity = Math.min(stock, existing.quantity + quantity);
          return prev.map((item) =>
            item.itemId === itemId ? { ...item, quantity: nextQuantity } : item
          );
        }

        return prev.map((item) =>
          item.itemId === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prev,
        {
          itemId,
          bookId: book._id,
          title: book.title,
          format,
          price: resolvePrice(book, format),
          quantity,
          coverImage: book.coverImage?.thumbnail || book.coverImage?.url || '',
          author: book.author,
        },
      ];
    });
  };

  const removeFromCart = (itemId) => {
    setItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const hasPhysicalItems = items.some((item) => item.format === 'physical');
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = calculateShipping(items);
  const tax = 0;
  const total = subtotal + shipping + tax;

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      hasPhysicalItems,
      subtotal,
      shipping,
      tax,
      total,
    }),
    [hasPhysicalItems, items, shipping, subtotal, tax, total]
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
