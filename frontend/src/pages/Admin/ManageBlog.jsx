import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Sidebar from '../../components/layout/Sidebar';
import blogService from '../../services/blogService';

const BLOG_FILTERS = ['all', 'published', 'draft'];

const DEFAULT_FORM_DATA = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  featuredImage: '',
  published: false,
  commentsEnabled: true,
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString();
};

const normalizePayload = (formData) => ({
  title: (formData.title || '').trim(),
  excerpt: (formData.excerpt || '').trim(),
  content: (formData.content || '').trim(),
  category: (formData.category || '').trim(),
  featuredImage: (formData.featuredImage || '').trim(),
  published: Boolean(formData.published),
  commentsEnabled: Boolean(formData.commentsEnabled),
});

export default function ManageBlog() {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingPost(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await blogService.getAdminPosts({
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setPosts(response.posts || []);
      setPagination(response.pagination || null);
    } catch (err) {
      setPosts([]);
      setError(err.message || 'Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = normalizePayload(formData);
      if (editingPost) {
        await blogService.updatePost(editingPost._id, payload);
        setSuccess('Blog post updated successfully.');
      } else {
        await blogService.createPost(payload);
        setSuccess('Blog post created successfully.');
      }
      closeModal();
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      featuredImage: post.featuredImage || '',
      published: Boolean(post.published),
      commentsEnabled: post.commentsEnabled !== false,
    });
    setIsModalOpen(true);
  };

  const onDelete = async (postId) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this post?');
    if (!shouldDelete) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await blogService.deletePost(postId);
      setSuccess('Blog post deleted successfully.');
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Failed to delete blog post.');
    }
  };

  const statusSummary = useMemo(() => {
    const published = posts.filter((post) => post.published).length;
    const draft = posts.filter((post) => !post.published).length;
    return [
      { label: 'Total Posts', value: pagination?.total ?? posts.length },
      { label: 'Published', value: published },
      { label: 'Drafts', value: draft },
    ];
  }, [pagination?.total, posts]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="space-y-4 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-mocha">Manage Blog</h1>
            <p className="mt-1 text-sm text-charcoal/70">
              Create, publish, and update blog posts from one place.
            </p>
          </div>
          <Button
            onClick={() => {
              setError('');
              setSuccess('');
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Add New Post
          </Button>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}

        <div className="grid gap-3 sm:grid-cols-3">
          {statusSummary.map((item) => (
            <article key={item.label} className="rounded-card border border-taupe/30 bg-oat/30 p-4">
              <p className="text-xs uppercase tracking-wide text-charcoal/70">{item.label}</p>
              <p className="mt-2 font-display text-3xl text-mocha">{item.value}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {BLOG_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={[
                'rounded-pill px-4 py-2 text-sm capitalize transition-colors duration-smooth ease-smooth',
                statusFilter === filter
                  ? 'bg-mocha text-milk'
                  : 'bg-oat text-mocha hover:bg-taupe hover:text-milk',
              ].join(' ')}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-card border border-taupe/30">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-oat/70">
              <tr>
                <th className="px-3 py-3 font-semibold text-charcoal">Title</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Category</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Date</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Status</th>
                <th className="px-3 py-3 font-semibold text-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-charcoal/70" colSpan={5}>
                    Loading blog posts...
                  </td>
                </tr>
              ) : null}

              {!loading && posts.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-charcoal/70" colSpan={5}>
                    No posts found for the selected filter.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? posts.map((post) => (
                    <tr key={post._id} className="border-t border-taupe/20 hover:bg-oat/20">
                      <td className="max-w-lg px-3 py-3 text-charcoal">
                        <p className="line-clamp-2">{post.title}</p>
                      </td>
                      <td className="px-3 py-3 text-mocha">{post.category || '-'}</td>
                      <td className="px-3 py-3 text-charcoal/70">
                        {formatDate(post.publishDate || post.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={[
                            'inline-flex rounded-pill px-3 py-1 text-xs',
                            post.published ? 'bg-success/15 text-success' : 'bg-charcoal/10 text-charcoal',
                          ].join(' ')}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onEdit(post)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-error text-milk hover:brightness-95"
                            onClick={() => onDelete(post._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-sm text-charcoal">
            Title *
            <input
              type="text"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-charcoal">
            Excerpt
            <textarea
              rows={3}
              value={formData.excerpt}
              onChange={(event) => setFormData((prev) => ({ ...prev, excerpt: event.target.value }))}
              className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-charcoal">
            Content *
            <textarea
              rows={10}
              value={formData.content}
              onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
              className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Category
              <input
                type="text"
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-charcoal">
              Featured Image URL
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.featuredImage}
                onChange={(event) => setFormData((prev) => ({ ...prev, featuredImage: event.target.value }))}
                className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-charcoal"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={Boolean(formData.published)}
                onChange={(event) => setFormData((prev) => ({ ...prev, published: event.target.checked }))}
              />
              Publish immediately
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={Boolean(formData.commentsEnabled)}
                onChange={(event) => setFormData((prev) => ({ ...prev, commentsEnabled: event.target.checked }))}
              />
              Enable comments
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
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
