import { useState } from 'react';
import Button from '../common/Button';

export default function BookmarkPanel({
  bookmarks = [],
  currentPage,
  onAddBookmark,
  onDeleteBookmark,
  onJump,
}) {
  const [note, setNote] = useState('');

  return (
    <aside className="w-full rounded-card border border-taupe/30 bg-milk p-4 shadow-soft lg:w-80">
      <h3 className="font-display text-2xl text-mocha">Bookmarks</h3>

      <div className="mt-3 space-y-2">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Add note"
          className="w-full rounded-card border border-taupe/40 bg-oat px-3 py-2 text-sm"
        />
        <Button
          size="sm"
          className="w-full"
          onClick={async () => {
            await onAddBookmark(currentPage, note);
            setNote('');
          }}
        >
          Save Bookmark
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {bookmarks.length === 0 ? (
          <p className="text-sm text-charcoal/60">No bookmarks yet.</p>
        ) : (
          bookmarks.map((bookmark) => (
            <article key={bookmark._id} className="rounded-card border border-taupe/30 bg-oat/50 p-3">
              <button
                type="button"
                className="text-left text-sm text-mocha underline"
                onClick={() => onJump?.(bookmark.page)}
              >
                Page {bookmark.page}
              </button>
              <p className="mt-1 text-xs text-charcoal/70">{bookmark.note || 'No note'}</p>
              <button
                type="button"
                className="mt-2 text-xs text-error"
                onClick={() => onDeleteBookmark(bookmark._id)}
              >
                Delete
              </button>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
