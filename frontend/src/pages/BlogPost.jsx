import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import blogService from '../services/blogService';

export default function BlogPost() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const nextPost = await blogService.getPostBySlug(slug);
        setPost(nextPost);
      } catch (_error) {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const submitComment = async () => {
    if (!post || !comment.trim()) {
      return;
    }

    try {
      await blogService.addComment(post._id, comment);
      setComment('');
      setMessage('Comment added successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return <div className="rounded-card bg-oat/60 p-8 text-center">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="rounded-card border border-error/30 bg-error/10 p-8 text-center text-error">
        Post not found.
      </div>
    );
  }

  return (
    <article className="space-y-5 rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-taupe">{post.category || 'General'}</p>
        <h1 className="mt-2 font-display text-5xl text-mocha">{post.title}</h1>
        <p className="mt-2 text-sm text-charcoal/70">By {post.author} on {new Date(post.publishDate || post.createdAt).toLocaleDateString()}</p>
      </header>

      {post.featuredImage ? (
        <div className="overflow-hidden rounded-card">
          <img src={post.featuredImage} alt={post.title} className="h-full max-h-[420px] w-full object-cover" />
        </div>
      ) : null}

      <section className="prose prose-stone max-w-none">
        <p>{post.content}</p>
      </section>

      <section className="rounded-card border border-taupe/30 bg-oat/40 p-4">
        <h2 className="font-display text-2xl text-mocha">Share</h2>
        <div className="mt-2 flex gap-2 text-sm text-charcoal/70">
          <button type="button" className="rounded-pill border border-taupe/50 px-3 py-1">X</button>
          <button type="button" className="rounded-pill border border-taupe/50 px-3 py-1">Facebook</button>
          <button type="button" className="rounded-pill border border-taupe/50 px-3 py-1">LinkedIn</button>
        </div>
      </section>

      {post.commentsEnabled ? (
        <section className="rounded-card border border-taupe/30 bg-oat/30 p-4">
          <h2 className="font-display text-2xl text-mocha">Comments</h2>
          {isAuthenticated ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Write your comment"
                className="w-full rounded-card border border-taupe/50 bg-milk px-3 py-2"
              />
              <Button size="sm" onClick={submitComment}>Post Comment</Button>
              {message ? <p className="text-sm text-charcoal/70">{message}</p> : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-charcoal/70">Login to add a comment.</p>
          )}

          <div className="mt-4 space-y-3">
            {(post.comments || []).map((item) => (
              <article key={item._id} className="rounded-card border border-taupe/30 bg-milk p-3">
                <p className="text-sm font-medium text-mocha">{item.name}</p>
                <p className="mt-1 text-sm text-charcoal/75">{item.comment}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
