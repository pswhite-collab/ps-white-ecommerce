import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const formatStyles = {
  ebook: 'bg-oat text-mocha',
  physical: 'bg-taupe text-milk',
  audiobook: 'bg-mocha/20 text-mocha',
};

const formatLabels = {
  ebook: 'eBook',
  physical: 'Physical',
  audiobook: 'Audio',
};

const getAvailableFormats = (book) =>
  Object.entries(book.formats || {})
    .filter(([, info]) => info?.available)
    .map(([key]) => key);

export default function BookCard({ book }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const availableFormats = getAvailableFormats(book);
  const defaultFormat =
    availableFormats.find(
      (format) => format !== 'physical' || (book.formats?.physical?.stock || 0) > 0
    ) ||
    availableFormats[0] ||
    'ebook';

  const isDefaultOutOfStock =
    defaultFormat === 'physical' && (book.formats?.physical?.stock || 0) <= 0;

  const price =
    book.formats?.[defaultFormat]?.price ||
    book.formats?.ebook?.price ||
    book.formats?.physical?.price ||
    book.formats?.audiobook?.price ||
    0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    addToCart(book, defaultFormat, 1);
  };

  return (
    <article className="group relative overflow-hidden rounded-card border border-oat bg-milk shadow-soft transition-all duration-smooth ease-smooth hover:-translate-y-2 hover:shadow-strong">
      {book.featured ? (
        <span className="absolute right-3 top-3 z-10 rounded-pill bg-mocha px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-milk">
          Featured
        </span>
      ) : null}

      <Link to={`/books/${book._id}`} className="block no-underline">
        <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,#232323,#685D54)]">
          {book.coverImage?.thumbnail || book.coverImage?.url ? (
            <img
              src={book.coverImage.thumbnail || book.coverImage.url}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-5 text-center">
              <div>
                <h3 className="font-display text-3xl text-milk">{book.title}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-milk/80">PS White</p>
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <h3 className="line-clamp-2 font-display text-3xl text-charcoal">{book.title}</h3>
        <p className="mt-1 text-sm text-mocha/85">{book.author || 'PS White'}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {availableFormats.map((format) => (
            <span
              key={format}
              className={[
                'rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                formatStyles[format] || 'bg-oat text-charcoal/80',
              ].join(' ')}
            >
              {formatLabels[format]}
              {' '}
              {`\u00A3${Number(book.formats?.[format]?.price || 0).toFixed(2)}`}
            </span>
          ))}
        </div>

        {book.formats?.physical?.available ? (
          <p className="mt-2 text-xs text-taupe">
            {book.formats.physical.stock > 0 ? (
              <>
                <span className="text-success">&#9679;</span>
                {' '}
                In Stock (
                {book.formats.physical.stock}
                {' '}
                available)
              </>
            ) : (
              <span className="text-error">Out of Stock</span>
            )}
          </p>
        ) : null}

        <div className="mt-3">
          <p className="font-display text-3xl font-semibold text-charcoal">
            {`\u00A3${price.toFixed(2)}`}
            <span className="ml-2 text-sm font-normal text-mocha/70">GBP</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to={`/books/${book._id}`} className="flex-1 no-underline">
            <Button size="sm" variant="outline" className="w-full">View</Button>
          </Link>
          <Button
            size="sm"
            className="flex-1"
            disabled={isDefaultOutOfStock}
            onClick={handleAddToCart}
          >
            {isDefaultOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </article>
  );
}
