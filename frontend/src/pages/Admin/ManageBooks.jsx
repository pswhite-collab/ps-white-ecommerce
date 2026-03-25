import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Sidebar from '../../components/layout/Sidebar';
import BookForm from '../../components/admin/BookForm';
import bookService from '../../services/bookService';

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await bookService.getBooks({ limit: 50 });
      setBooks(data.books);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const saveBook = async (payload) => {
    setSaving(true);
    setError('');

    try {
      const book = editingBook
        ? await bookService.updateBook(editingBook._id, payload)
        : await bookService.createBook(payload);
      await loadBooks();
      return book;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-mocha">Manage Books</h1>
            <p className="mt-1 text-sm text-charcoal/70">Create, edit, archive, and upload files for your catalog.</p>
          </div>
          <Button onClick={() => {
            setEditingBook(null);
            setIsModalOpen(true);
          }}>
            Add New Book
          </Button>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        {loading ? (
          <div className="rounded-card bg-oat/60 p-8">Loading books...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-taupe/40 text-charcoal/70">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Formats</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Sales</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id} className="border-b border-taupe/20">
                    <td className="px-3 py-2 font-medium text-mocha">{book.title}</td>
                    <td className="px-3 py-2 text-charcoal/70">
                      {Object.entries(book.formats || {})
                        .filter(([, value]) => value?.available)
                        .map(([key]) => key)
                        .join(', ') || 'None'}
                    </td>
                    <td className="px-3 py-2">${book.formats?.ebook?.price?.toFixed?.(2) || '0.00'}</td>
                    <td className="px-3 py-2">{book.totalSales || 0}</td>
                    <td className="px-3 py-2">{book.active ? 'Active' : 'Archived'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingBook(book);
                          setIsModalOpen(true);
                        }}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            await bookService.deleteBook(book._id);
                            await loadBooks();
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBook ? 'Edit Book' : 'Add New Book'}
        >
          <BookForm
            initialValue={editingBook}
            submitting={saving}
            onSubmit={saveBook}
            onClose={() => setIsModalOpen(false)}
          />
        </Modal>
      </section>
    </div>
  );
}
