import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import readerService from '../services/readerService';

const ReaderContext = createContext(null);

export const ReaderProvider = ({ children }) => {
  const [currentBook, setCurrentBook] = useState(null);
  const [bookId, setBookId] = useState(null);
  const [contentUrls, setContentUrls] = useState({ epubUrl: null, pdfUrl: null });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [settings, setSettings] = useState({
    fontSize: 100,
    fontFamily: 'Cormorant Garamond',
    theme: 'light',
    lineSpacing: 1.5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dirtyRef = useRef(false);

  const loadBook = useCallback(async (nextBookId) => {
    setLoading(true);
    setError(null);

    try {
      const [content, progress, metadata] = await Promise.all([
        readerService.getBookContent(nextBookId),
        readerService.getProgress(nextBookId),
        readerService.getReaderMetadata(nextBookId),
      ]);

      setBookId(nextBookId);
      setContentUrls(content);
      setCurrentBook({ id: nextBookId, title: metadata.title, author: metadata.author });
      setCurrentPage(progress?.currentPage || 0);
      setTotalPages(progress?.totalPages || metadata.pageCount || 0);
      setBookmarks(progress?.bookmarks || []);
      setSettings((prev) => ({ ...prev, ...(progress?.settings || {}) }));
      dirtyRef.current = false;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistProgress = useCallback(async () => {
    if (!bookId || !dirtyRef.current) {
      return;
    }

    try {
      await readerService.updateProgress(bookId, {
        currentPage,
        totalPages,
        readingMinutes: 1,
      });
      dirtyRef.current = false;
    } catch (_error) {
      // ignore autosave errors; explicit saves still happen on interactions
    }
  }, [bookId, currentPage, totalPages]);

  useEffect(() => {
    const timer = setInterval(() => {
      persistProgress();
    }, 30_000);

    return () => clearInterval(timer);
  }, [persistProgress]);

  const updatePage = async (page, nextTotalPages = totalPages) => {
    setCurrentPage(page);
    if (nextTotalPages) {
      setTotalPages(nextTotalPages);
    }

    dirtyRef.current = true;

    try {
      const progress = await readerService.updateProgress(bookId, {
        currentPage: page,
        totalPages: nextTotalPages,
        readingMinutes: 0,
      });
      setBookmarks(progress?.bookmarks || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const addBookmark = async (page, note) => {
    try {
      const progress = await readerService.addBookmark(bookId, { page, note });
      setBookmarks(progress?.bookmarks || []);
      return progress;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteBookmark = async (bookmarkId) => {
    try {
      const progress = await readerService.deleteBookmark(bookId, bookmarkId);
      setBookmarks(progress?.bookmarks || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateSettings = async (nextSettings) => {
    try {
      const saved = await readerService.updateSettings(bookId, {
        ...settings,
        ...nextSettings,
      });
      setSettings((prev) => ({ ...prev, ...saved }));
    } catch (err) {
      setError(err.message);
    }
  };

  const value = useMemo(
    () => ({
      currentBook,
      bookId,
      contentUrls,
      currentPage,
      totalPages,
      bookmarks,
      settings,
      loading,
      error,
      loadBook,
      updatePage,
      addBookmark,
      deleteBookmark,
      updateSettings,
      setTotalPages,
    }),
    [
      addBookmark,
      bookmarks,
      bookId,
      contentUrls,
      currentBook,
      currentPage,
      error,
      loadBook,
      loading,
      settings,
      totalPages,
    ]
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
