import Card from '../common/Card';

export default function BookDetail({ book }) {
  if (!book) {
    return (
      <Card>
        <p className="text-charcoal/70">Book details are unavailable.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-display text-3xl text-mocha">{book.title}</h3>
      <p className="mt-2 text-charcoal/70">{book.author}</p>
      <p className="mt-3 text-charcoal/75">{book.description}</p>
    </Card>
  );
}
