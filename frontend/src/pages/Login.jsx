import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'oauth_failed'
      ? 'Google sign-in failed. Please try again.'
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [oauthInProgress, setOauthInProgress] = useState(false);

  const handleGoogleLogin = () => {
    if (oauthInProgress) {
      return;
    }

    const lastAttempt = localStorage.getItem('lastGoogleLoginAttempt');
    const now = Date.now();

    if (lastAttempt && now - Number.parseInt(lastAttempt, 10) < 60 * 1000) {
      setError('Please wait a moment before trying Google sign-in again.');
      return;
    }

    localStorage.setItem('lastGoogleLoginAttempt', String(now));
    setError('');
    setOauthInProgress(true);

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/library');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-card border border-taupe/30 bg-milk p-8 shadow-soft">
      <h1 className="font-display text-4xl text-mocha">Login</h1>
      <p className="mt-2 text-sm text-charcoal/70">Sign in to access your library and purchases.</p>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={oauthInProgress}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-card border border-taupe/50 bg-milk px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-oat"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-milk text-xs text-mocha">G</span>
        {oauthInProgress ? 'Redirecting to Google...' : 'Sign in with Google'}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-taupe">
        <span className="h-px flex-1 bg-oat" />
        OR
        <span className="h-px flex-1 bg-oat" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-charcoal/70">
        New reader? <Link to="/register" className="text-mocha underline">Create an account</Link>
      </p>
    </section>
  );
}
