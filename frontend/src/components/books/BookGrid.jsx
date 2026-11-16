import BookCard from './BookCard';

export default function BookGrid({ books = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-card border border-oat bg-milk shadow-soft">
            <div className="h-72 animate-pulse bg-oat/70" />
            <div className="space-y-3 p-4">
              <div className="h-7 w-3/4 animate-pulse rounded bg-oat/70" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-oat/60" />
              <div className="h-10 animate-pulse rounded-pill bg-oat/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!books.length) {
    return (
      <div className="rounded-card border border-taupe/30 bg-milk p-8 text-center text-charcoal/70 shadow-soft">
        No books match your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book._id} book={book} />
      ))}
    </div>
  );
}
