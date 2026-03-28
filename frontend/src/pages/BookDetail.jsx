import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ReviewsSection from '../components/books/ReviewsSection';
import ReviewForm from '../components/books/ReviewForm';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import bookService from '../services/bookService';
import readerService from '../services/readerService';

const tabs = ['Description', 'Reviews', 'About Author'];

export default function BookDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [activeTab, setActiveTab] = useState('Description');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  useEffect(() => {
    const loadBook = async () => {
      setLoading(true);
      setError('');
      try {
        const detail = await bookService.getBookById(id);
        setBook(detail);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  useEffect(() => {
    if (!book) {
      setSelectedFormat('');
      setSelectedPrice(0);
      return;
    }

    if (book.formats?.ebook?.available) {
      setSelectedFormat('ebook');
      setSelectedPrice(Number(book.formats.ebook.price || 0));
      return;
    }

    if (book.formats?.physical?.available) {
      setSelectedFormat('physical');
      setSelectedPrice(Number(book.formats.physical.price || 0));
      return;
    }

    if (book.formats?.audiobook?.available) {
      setSelectedFormat('audiobook');
      setSelectedPrice(Number(book.formats.audiobook.price || 0));
      return;
    }

    setSelectedFormat('');
    setSelectedPrice(0);
  }, [book]);

  if (loading) {
    return <div className="rounded-card bg-oat/70 p-8 text-center">Loading book details...</div>;
  }

  if (error || !book) {
    return (
      <div className="rounded-card border border-error/30 bg-error/10 p-8 text-center text-error">
        {error || 'Book not found'}
      </div>
    );
  }

  const physicalOutOfStock =
    selectedFormat === 'physical' && (book.formats?.physical?.stock || 0) <= 0;

  const openPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError('');

    try {
      const preview = await readerService.getBookPreview(book._id);
      setPreviewData(preview);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    addToCart(book, selectedFormat, 1);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{book.title} | PS White Books</title>
        <meta name="description" content={book.description ? book.description.substring(0, 160) : `Purchase ${book.title}`} />
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={book.description ? book.description.substring(0, 160) : `Purchase ${book.title}`} />
        {book.coverImage?.url ? <meta property="og:image" content={book.coverImage.url} /> : null}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['Book', 'Product'],
            name: book.title,
            author: {
              '@type': 'Person',
              name: book.author || 'PS White',
            },
            description: book.description,
            isbn: book.formats?.physical?.isbn || undefined,
            offers: {
              '@type': 'Offer',
              price: selectedPrice,
              priceCurrency: 'GBP',
              availability: physicalOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.ps-white.com/' },
              { '@type': 'ListItem', position: 2, name: 'Books', item: 'https://www.ps-white.com/books' },
              { '@type': 'ListItem', position: 3, name: book.title, item: `https://www.ps-white.com/book/${book._id}` },
            ],
          })}
        </script>
      </Helmet>
      <Card className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="aspect-[3/4] overflow-hidden rounded-card bg-oat">
          {book.coverImage?.url ? (
            <img src={book.coverImage.url} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-charcoal/70">No cover image</div>
          )}
        </div>

        <div>
          <h1 className="font-display text-5xl text-mocha">{book.title}</h1>
          <p className="mt-2 text-lg text-charcoal/70">{book.author}</p>
          <p className="mt-2 text-sm text-charcoal/70">Rating: {book.averageRating ? book.averageRating.toFixed(1) : 'New'}</p>
          <p className="mt-4 font-semibold leading-relaxed text-charcoal">
            {book.title} ({book.formats?.physical?.publicationDate ? new Date(book.formats.physical.publicationDate).getFullYear() : '2024'}) by {book.author}.
            {' '}
            Language: {book.formats?.physical?.language || 'English'}.
            {' '}
            Pages: {book.formats?.physical?.pages || book.formats?.ebook?.pageCount || '320'}.
            {book.formats?.physical?.isbn ? ` ISBN: ${book.formats.physical.isbn}.` : ''}
          </p>
          <p className="mt-2 text-charcoal/75">{book.description || 'Description coming soon.'}</p>

          <div className="mt-5 space-y-3">
            <p className="text-sm font-medium text-charcoal">Choose Format</p>

            {book.formats?.ebook?.available ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('ebook');
                  setSelectedPrice(Number(book.formats.ebook.price || 0));
                }}
                className={[
                  'w-full rounded-card border-2 p-4 text-left transition-all',
                  selectedFormat === 'ebook'
                    ? 'border-mocha bg-mocha/10'
                    : 'border-oat bg-milk hover:border-taupe',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-charcoal">eBook</p>
                    <p className="text-sm text-taupe">Instant digital delivery</p>
                  </div>
                  <p className="text-lg font-bold text-mocha">
                    &pound;
                    {Number(book.formats.ebook.price || 0).toFixed(2)}
                  </p>
                </div>
              </button>
            ) : null}

            {book.formats?.physical?.available ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('physical');
                  setSelectedPrice(Number(book.formats.physical.price || 0));
                }}
                className={[
                  'w-full rounded-card border-2 p-4 text-left transition-all',
                  selectedFormat === 'physical'
                    ? 'border-mocha bg-mocha/10'
                    : 'border-oat bg-milk hover:border-taupe',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-charcoal">Physical Book</p>
                    <p className="text-sm text-taupe">
                      {book.formats.physical.binding || 'Paperback'}
                      {' '}
                      &middot; Ships in 3-7 days
                    </p>
                    {book.formats.physical.stock > 0 ? (
                      <p className="mt-1 text-xs text-success">
                        In Stock (
                        {book.formats.physical.stock}
                        {' '}
                        available)
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-error">Out of Stock</p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-mocha">
                    &pound;
                    {Number(book.formats.physical.price || 0).toFixed(2)}
                  </p>
                </div>
              </button>
            ) : null}

            {book.formats?.audiobook?.available ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('audiobook');
                  setSelectedPrice(Number(book.formats.audiobook.price || 0));
                }}
                className={[
                  'w-full rounded-card border-2 p-4 text-left transition-all',
                  selectedFormat === 'audiobook'
                    ? 'border-mocha bg-mocha/10'
                    : 'border-oat bg-milk hover:border-taupe',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-charcoal">Audiobook</p>
                    <p className="text-sm text-taupe">Instant digital delivery</p>
                  </div>
                  <p className="text-lg font-bold text-mocha">
                    &pound;
                    {Number(book.formats.audiobook.price || 0).toFixed(2)}
                  </p>
                </div>
              </button>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold text-mocha">{`\u00A3${selectedPrice.toFixed(2)}`}</span>
            <Button
              disabled={!selectedFormat || physicalOutOfStock}
              onClick={handleAddToCart}
            >
              {physicalOutOfStock
                ? 'Out of Stock'
                : `Add to Cart${selectedPrice ? ` - \u00A3${selectedPrice.toFixed(2)}` : ''}`}
            </Button>
            <Button variant="outline" onClick={openPreview}>Preview Chapter</Button>
            <Link to={`/reader/${book._id}`}>
              <Button variant="secondary">Read in Reader</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={[
              'rounded-pill px-4 py-2 text-sm transition-colors',
              activeTab === tab ? 'bg-mocha text-milk' : 'bg-oat text-charcoal hover:bg-taupe/40',
            ].join(' ')}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Description' ? (
        <Card>
          <h3 className="font-display text-3xl text-mocha">Description</h3>
          <p className="mt-3 font-semibold text-charcoal/90">
            {book.title} ({book.formats?.physical?.publicationDate ? new Date(book.formats.physical.publicationDate).getFullYear() : '2024'}) by {book.author}.
            {' '}
            Language: {book.formats?.physical?.language || 'English'}.
            {' '}
            Pages: {book.formats?.physical?.pages || book.formats?.ebook?.pageCount || '320'}.
            {book.formats?.physical?.isbn ? ` ISBN: ${book.formats.physical.isbn}.` : ''}
          </p>
          <p className="mt-3 text-charcoal/75">{book.description || 'No description available.'}</p>
        </Card>
      ) : null}

      {activeTab === 'Reviews' ? (
        <div className="space-y-4">
          <ReviewForm
            bookId={book._id}
            onSubmitted={() => {
              setReviewsRefreshKey((prev) => prev + 1);
            }}
          />
          <ReviewsSection bookId={book._id} refreshKey={reviewsRefreshKey} />
        </div>
      ) : null}

      {activeTab === 'About Author' ? (
        <Card>
          <h3 className="font-display text-3xl text-mocha">About Author</h3>
          <p className="mt-3 text-charcoal/75">
            PS White writes immersive stories with emotional depth and practical wisdom.
          </p>
        </Card>
      ) : null}

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewData?.previewDetails?.title || 'Book Preview'}
      >
        {previewLoading ? (
          <p className="text-sm text-charcoal/70">Loading preview...</p>
        ) : null}

        {!previewLoading && previewError ? (
          <p className="text-sm text-error">{previewError}</p>
        ) : null}

        {!previewLoading && !previewError ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-charcoal/60">
              {previewData?.author || book.author} | Approx.
              {' '}
              {previewData?.previewDetails?.estimatedReadMinutes || 1}
              {' '}
              min read
            </p>
            <div className="max-h-[55vh] overflow-auto rounded-card bg-oat/25 p-4 text-sm leading-relaxed text-charcoal/85">
              {(previewData?.previewDetails?.content || previewData?.preview || 'Preview unavailable.')
                .split('\n')
                .map((line, index) => (
                  <p key={`${line}-${index}`} className="mb-3 last:mb-0">{line}</p>
                ))}
            </div>
            {previewData?.previewDetails?.truncated ? (
              <p className="text-xs text-charcoal/60">
                Preview is limited to the first chapter sample. Purchase the book to continue reading.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
