import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Sidebar from '../../components/layout/Sidebar';
import adminService from '../../services/adminService';

const DEFAULT_FORM_STATE = {
  text: '',
  author: 'PS White',
  category: 'general',
  startDate: '',
  endDate: '',
  active: true,
};

const quoteStatuses = ['all', 'active', 'upcoming', 'expired'];

const toInputDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - timezoneOffset);
  return local.toISOString().slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
};

const normalizeQuoteStatus = (quote) => {
  const now = new Date();
  const start = new Date(quote.startDate);
  const end = new Date(quote.endDate);

  if (!quote.active) {
    return {
      label: 'Inactive',
      className: 'bg-charcoal/10 text-charcoal',
    };
  }
  if (now < start) {
    return {
      label: 'Upcoming',
      className: 'bg-info/15 text-info',
    };
  }
  if (now > end) {
    return {
      label: 'Expired',
      className: 'bg-warning/15 text-warning',
    };
  }
  return {
    label: 'Active',
    className: 'bg-success/15 text-success',
  };
};

export default function ManageQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);

  const resetForm = () => {
    setFormData(DEFAULT_FORM_STATE);
    setEditingQuote(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getQuotes(statusFilter === 'all' ? '' : statusFilter);
      setQuotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load quotes.');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getQuoteStats();
      setStats(data);
    } catch (_err) {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
    loadStats();
  }, [loadQuotes, loadStats]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingQuote) {
        await adminService.updateQuote(editingQuote._id, formData);
        setSuccess('Quote updated successfully.');
      } else {
        await adminService.createQuote(formData);
        setSuccess('Quote created successfully.');
      }
      closeModal();
      await Promise.all([loadQuotes(), loadStats()]);
    } catch (err) {
      setError(err.message || 'Failed to save quote.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (quote) => {
    setEditingQuote(quote);
    setFormData({
      text: quote.text || '',
      author: quote.author || 'PS White',
      category: quote.category || 'general',
      startDate: toInputDate(quote.startDate),
      endDate: toInputDate(quote.endDate),
      active: quote.active !== false,
    });
    setIsModalOpen(true);
  };

  const onDelete = async (quoteId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this quote?');
    if (!shouldDelete) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await adminService.deleteQuote(quoteId);
      setSuccess('Quote deleted successfully.');
      await Promise.all([loadQuotes(), loadStats()]);
    } catch (err) {
      setError(err.message || 'Failed to delete quote.');
    }
  };

  const statusSummary = useMemo(
    () => [
      { label: 'Total Quotes', value: stats?.totalQuotes ?? 0 },
      { label: 'Active Now', value: stats?.activeQuotes ?? 0 },
      { label: 'Upcoming', value: stats?.upcomingQuotes ?? 0 },
      { label: 'Total Views', value: stats?.totalViews ?? 0 },
    ],
    [stats]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-mocha">Quote of the Day</h1>
            <p className="mt-1 text-sm text-charcoal/70">
              Schedule daily quotes for visitors and track quote views.
            </p>
          </div>
          <Button
            onClick={() => {
              setSuccess('');
              setError('');
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Add New Quote
          </Button>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statusSummary.map((item) => (
            <article key={item.label} className="rounded-card border border-taupe/30 bg-oat/30 p-4">
              <p className="text-xs uppercase tracking-wide text-charcoal/70">{item.label}</p>
              <p className="mt-2 font-display text-3xl text-mocha">{item.value}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {quoteStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={[
                'rounded-pill px-4 py-2 text-sm capitalize transition-colors duration-smooth ease-smooth',
                statusFilter === status
                  ? 'bg-mocha text-milk'
                  : 'bg-oat text-mocha hover:bg-taupe hover:text-milk',
              ].join(' ')}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-card border border-taupe/30">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-oat/70">
              <tr>
                <th className="px-3 py-3 font-semibold text-charcoal">Quote</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Author</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Start Date</th>
                <th className="px-3 py-3 font-semibold text-charcoal">End Date</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Views</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Status</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-charcoal/70" colSpan={7}>
                    Loading quotes...
                  </td>
                </tr>
              ) : null}

              {!loading && quotes.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-charcoal/70" colSpan={7}>
                    No quotes found for the selected filter.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? quotes.map((quote) => {
                    const status = normalizeQuoteStatus(quote);
                    return (
                      <tr key={quote._id} className="border-t border-taupe/20 hover:bg-oat/20">
                        <td className="max-w-xl px-3 py-3 text-charcoal">
                          <p className="line-clamp-2">"{quote.text}"</p>
                        </td>
                        <td className="px-3 py-3 text-mocha">{quote.author}</td>
                        <td className="px-3 py-3 text-charcoal/70">{formatDateTime(quote.startDate)}</td>
                        <td className="px-3 py-3 text-charcoal/70">{formatDateTime(quote.endDate)}</td>
                        <td className="px-3 py-3 text-charcoal">{quote.viewCount || 0}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-pill px-3 py-1 text-xs ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onEdit(quote)}>
                              Edit
                            </Button>
                            <Button size="sm" className="bg-error text-milk hover:brightness-95" onClick={() => onDelete(quote._id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingQuote ? 'Edit Quote' : 'Add New Quote'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-sm text-charcoal">
            Quote Text *
            <textarea
              rows={4}
              maxLength={500}
              value={formData.text}
              onChange={(event) => setFormData((prev) => ({ ...prev, text: event.target.value }))}
              className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              required
            />
            <span className="text-xs text-charcoal/70">{formData.text.length}/500</span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Author
              <input
                type="text"
                value={formData.author}
                onChange={(event) => setFormData((prev) => ({ ...prev, author: event.target.value }))}
                className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Category
              <select
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              >
                <option value="general">General</option>
                <option value="inspiration">Inspiration</option>
                <option value="motivation">Motivation</option>
                <option value="life">Life</option>
                <option value="writing">Writing</option>
                <option value="reading">Reading</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Start Date *
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              End Date *
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))}
                className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
                required
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={Boolean(formData.active)}
              onChange={(event) => setFormData((prev) => ({ ...prev, active: event.target.checked }))}
            />
            Keep quote active
          </label>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingQuote ? 'Update Quote' : 'Create Quote'}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

