import { useEffect, useMemo, useState } from 'react';
import LibraryGrid from '../components/library/LibraryGrid';
import ReadingStats from '../components/library/ReadingStats';
import readerService from '../services/readerService';

const formatMinutes = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function Library() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const [library, statsData] = await Promise.all([
          readerService.getLibrary(),
          readerService.getStats(),
        ]);

        setItems(library);
        setStats(statsData);
      } catch (_error) {
        setItems([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, []);

  const filteredItems = useMemo(() => {
    let nextItems = [...items];

    if (filter === 'reading') {
      nextItems = nextItems.filter((item) => (item.progress?.progressPercentage || 0) > 0 && (item.progress?.progressPercentage || 0) < 100);
    }

    if (filter === 'completed') {
      nextItems = nextItems.filter((item) => (item.progress?.progressPercentage || 0) >= 100);
    }

    if (sort === 'title') {
      nextItems.sort((a, b) => a.book.title.localeCompare(b.book.title));
    }

    if (sort === 'progress') {
      nextItems.sort((a, b) => (b.progress?.progressPercentage || 0) - (a.progress?.progressPercentage || 0));
    }

    if (sort === 'recent') {
      nextItems.sort(
        (a, b) => new Date(b.progress?.lastReadAt || 0).getTime() - new Date(a.progress?.lastReadAt || 0).getTime()
      );
    }

    return nextItems;
  }, [filter, items, sort]);

  const statsPayload = {
    totalBooks: items.length,
    currentlyReading: items.filter((item) => {
      const p = item.progress?.progressPercentage || 0;
      return p > 0 && p < 100;
    }).length,
    booksCompleted: items.filter((item) => (item.progress?.progressPercentage || 0) >= 100).length,
    totalPagesRead: stats?.totalPagesRead || 0,
    readingTimeLabel: formatMinutes(stats?.totalReadingTime || 0),
  };

  if (loading) {
    return <div className="rounded-card bg-oat/70 p-8 text-center">Loading library...</div>;
  }

  return (
    <section className="space-y-6">
      <ReadingStats stats={statsPayload} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {['all', 'reading', 'completed'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={[
                'rounded-pill px-4 py-2 text-sm',
                filter === item ? 'bg-mocha text-milk' : 'bg-oat text-charcoal',
              ].join(' ')}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
        >
          <option value="recent">Recent</option>
          <option value="title">Title</option>
          <option value="progress">Progress</option>
        </select>
      </div>

      <LibraryGrid
        items={filteredItems}
        onDownload={(bookId, format) => readerService.downloadBook(bookId, format)}
      />
    </section>
  );
}
