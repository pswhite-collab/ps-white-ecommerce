import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BookmarkPanel from '../components/reader/BookmarkPanel';
import EbookReader from '../components/reader/EbookReader';
import ProgressBar from '../components/reader/ProgressBar';
import ReaderControls from '../components/reader/ReaderControls';
import { useReader } from '../context/ReaderContext';

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const readerRef = useRef(null);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const {
    currentBook,
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
  } = useReader();

  useEffect(() => {
    loadBook(bookId);
  }, [bookId, loadBook]);

  const progressPercent = useMemo(() => {
    if (!totalPages) {
      return 0;
    }
    return Math.min(100, Math.round((currentPage / totalPages) * 100));
  }, [currentPage, totalPages]);

  if (loading) {
    return <div className="rounded-card bg-oat/70 p-8 text-center">Loading reader...</div>;
  }

  if (error) {
    return (
      <div className="rounded-card border border-error/30 bg-error/10 p-8 text-center text-error">
        {error}
      </div>
    );
  }

  return (
    <section className={[
      'space-y-4',
      settings.theme === 'dark' ? 'reader-dark' : settings.theme === 'sepia' ? 'reader-sepia' : 'reader-light',
    ].join(' ')}>
      <ReaderControls
        title={currentBook?.title}
        settings={settings}
        onSettingsChange={updateSettings}
        onPrev={() => readerRef.current?.prev()}
        onNext={() => readerRef.current?.next()}
        onBack={() => navigate('/library')}
        onToggleBookmarks={() => setShowBookmarks((prev) => !prev)}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="h-[70vh]">
          <EbookReader
            ref={readerRef}
            epubUrl={contentUrls.epubUrl}
            pdfUrl={contentUrls.pdfUrl}
            currentPage={currentPage || 1}
            onPageChange={(page) => updatePage(page, totalPages || 0)}
            onTotalPages={(pages) => setTotalPages(pages)}
            settings={settings}
            watermarkText={contentUrls?.security?.watermarkText}
          />
        </div>

        {showBookmarks ? (
          <BookmarkPanel
            bookmarks={bookmarks}
            currentPage={currentPage || 1}
            onAddBookmark={addBookmark}
            onDeleteBookmark={deleteBookmark}
            onJump={(page) => updatePage(page, totalPages || 0)}
          />
        ) : null}
      </div>

      <footer className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between text-sm text-charcoal/70">
          <span>Page {currentPage || 0} of {totalPages || 0}</span>
          <span>{progressPercent}% completed</span>
        </div>
        {contentUrls?.expiresAt ? (
          <p className="mb-2 text-xs text-charcoal/60">
            Secure access expires at {new Date(contentUrls.expiresAt).toLocaleString()}.
          </p>
        ) : null}
        <ProgressBar
          progress={progressPercent}
          onJump={(ratio) => {
            const page = Math.max(1, Math.round((totalPages || 1) * ratio));
            updatePage(page, totalPages || 0);
          }}
        />
      </footer>
    </section>
  );
}
