import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import blogService from '../services/blogService';
import Button from '../components/common/Button';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await blogService.getPosts({ page, limit: 6 });
        setPosts(response.posts);
        setPagination(response.pagination || { totalPages: 1 });
      } catch (_error) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page]);

  return (
    <section className="space-y-5">
      <header className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <h1 className="font-display text-5xl text-mocha">Blog</h1>
        <p className="mt-2 text-charcoal/70">Reflections, stories, and behind-the-scenes writing notes.</p>
      </header>

      {loading ? (
        <div className="rounded-card bg-oat/60 p-8 text-center">Loading posts...</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post._id} className="rounded-card border border-taupe/30 bg-milk p-4 shadow-soft">
              <div className="aspect-video overflow-hidden rounded-card bg-oat">
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-charcoal/60">No image</div>
                )}
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.15em] text-taupe">{post.category || 'General'}</p>
              <h2 className="mt-1 font-display text-3xl text-mocha">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-charcoal/70">{post.excerpt || 'Read more...'}</p>
              <p className="mt-3 text-xs text-charcoal/60">By {post.author} on {new Date(post.publishDate || post.createdAt).toLocaleDateString()}</p>
              <Link to={`/blog/${post.slug}`} className="mt-4 inline-block">
                <Button size="sm">Read Post</Button>
              </Link>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-card border border-taupe/30 bg-milk p-3 shadow-soft">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Prev</Button>
        <span className="text-sm text-charcoal/70">Page {page} of {pagination.totalPages || 1}</span>
        <Button size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
      </div>
    </section>
  );
}
