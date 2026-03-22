import BookCard from './BookCard';

export default function BookGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <BookCard />
      <BookCard />
      <BookCard />
    </div>
  );
}
