import { useEffect, useMemo, useState } from 'react';
import BookGrid from '../components/books/BookGrid';
import BookFilters from '../components/books/BookFilters';
import Button from '../components/common/Button';
import bookService from '../services/bookService';

const defaultFilters = {
  format: '',
  genre: '',
  sort: '',
  maxPrice: 5000,
};

export default function Books() {
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBooks = async (page = 1, activeFilters = filters) => {
    setLoading(true);
    try {
      const response = await bookService.getBooks({
        page,
        limit: 8,
        format: activeFilters.format || undefined,
        genre: activeFilters.genre || undefined,
        sort: activeFilters.sort || undefined,
        search: debouncedSearch || undefined,
      });

      const filteredByPrice = response.books.filter((book) => {
        const prices = [
          book.formats?.ebook?.price,
          book.formats?.physical?.price,
          book.formats?.audiobook?.price,
        ].filter((value) => typeof value === 'number');

        const minPrice = prices.length ? Math.min(...prices) : 0;
        return minPrice <= (activeFilters.maxPrice || 5000);
      });

      setBooks(filteredByPrice);
      setPagination(response.pagination || { page: 1, totalPages: 1 });
    } catch (_error) {
      setBooks([]);
      setPagination({ page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(1, filters);
  }, [debouncedSearch]);

  const paginationLabel = useMemo(() => {
    const page = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;
    return `Page ${page} of ${totalPages}`;
  }, [pagination]);

  return (
    <section className="space-y-5">
      <div className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Books</h1>
        <p className="mt-2 text-charcoal/70">Discover eBooks, physical editions, and audiobooks.</p>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, author, or keyword"
          className="mt-4 w-full rounded-card border border-taupe/50 bg-oat px-4 py-3"
        />
      </div>

      <BookFilters
        filters={filters}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          loadBooks(1, nextFilters);
        }}
        onClear={() => {
          setFilters(defaultFilters);
          setSearch('');
          setDebouncedSearch('');
          loadBooks(1, defaultFilters);
        }}
      />

      <BookGrid books={books} loading={loading} />

      <div className="flex items-center justify-between rounded-card border border-taupe/30 bg-milk p-3 shadow-soft">
        <Button
          size="sm"
          variant="outline"
          disabled={(pagination.page || 1) <= 1 || loading}
          onClick={() => loadBooks((pagination.page || 1) - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-charcoal/70">{paginationLabel}</span>
        <Button
          size="sm"
          disabled={(pagination.page || 1) >= (pagination.totalPages || 1) || loading}
          onClick={() => loadBooks((pagination.page || 1) + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
