import { Link } from 'react-router-dom';
import Button from '../common/Button';

export default function LibraryGrid({ items = [], onDownload }) {
  if (!items.length) {
    return (
      <div className="rounded-card border border-taupe/30 bg-milk p-6 text-center text-charcoal/70 shadow-soft">
        No books yet. Browse our collection.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map(({ book, progress }) => {
        const percent = progress?.progressPercentage || 0;
        const lastReadLabel = progress?.lastReadAt ? new Date(progress.lastReadAt).toLocaleString() : 'Not started';

        const pdfUrl = book?.formats?.ebook?.files?.pdf?.url;
        const epubUrl = book?.formats?.ebook?.files?.epub?.url;

        return (
          <article key={book._id} className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
            <div className="aspect-[3/4] overflow-hidden rounded-card bg-oat">
              {book.coverImage?.thumbnail || book.coverImage?.url ? (
                <img src={book.coverImage.thumbnail || book.coverImage.url} alt={book.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-charcoal/60">No cover</div>
              )}
            </div>

            <h3 className="mt-3 font-display text-2xl text-mocha">{book.title}</h3>
            <p className="text-sm text-charcoal/70">{book.author}</p>
            <p className="mt-1 text-xs text-charcoal/60">Last read: {lastReadLabel}</p>

            <div className="mt-3 h-2 w-full rounded-full bg-oat">
              <div className="h-full rounded-full bg-mocha" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-charcoal/60">{percent}% completed</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {epubUrl ? (
                <Link to={`/reader/${book._id}`}>
                  <Button size="sm">{percent > 0 ? 'Continue Reading' : 'Start Reading'}</Button>
                </Link>
              ) : (
                <Button size="sm" className="opacity-50 cursor-not-allowed" onClick={(e) => e.preventDefault()}>
                  {percent > 0 ? 'Continue Reading' : 'Start Reading'}
                </Button>
              )}

              {pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">Download PDF</Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" className="opacity-50 cursor-not-allowed" onClick={(e) => e.preventDefault()}>
                  Download PDF
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
