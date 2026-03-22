import {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

const ReaderContext = createContext(null);

export const ReaderProvider = ({ children }) => {
  const [currentBook, setCurrentBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState({
    fontSize: 100,
    fontFamily: 'Cormorant Garamond',
    theme: 'light',
    lineSpacing: 1.5,
  });
  const [bookmarks, setBookmarks] = useState([]);

  const loadBook = (book) => {
    setCurrentBook(book);
    setCurrentPage(1);
    setBookmarks([]);
  };

  const updatePage = (page) => {
    setCurrentPage(page);
  };

  const addBookmark = (bookmark) => {
    setBookmarks((prev) => [...prev, { ...bookmark, createdAt: new Date().toISOString() }]);
  };

  const updateSettings = (nextSettings) => {
    setSettings((prev) => ({ ...prev, ...nextSettings }));
  };

  const value = useMemo(
    () => ({
      currentBook,
      currentPage,
      settings,
      bookmarks,
      loadBook,
      updatePage,
      addBookmark,
      updateSettings,
    }),
    [bookmarks, currentBook, currentPage, settings]
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
};

export const useReader = () => {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReader must be used within ReaderProvider');
  }
  return context;
};
