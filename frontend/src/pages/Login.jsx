import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { getCustomerGoogleAuthUrl } from '../utils/apiConfig';

const mapOAuthError = (errorCode) => {
  switch (errorCode) {
    case 'oauth_failed':
      return 'Google sign-in could not be completed. Please try again.';
    case 'registration_closed':
      return 'New user registration is currently disabled.';
    case 'account_disabled':
      return 'This account has been disabled. Please contact support.';
    case 'access_denied':
      return 'Access denied. You are not authorized to sign in.';
    case 'rate_limited':
      return 'Too many sign-in attempts. Please wait a few minutes before trying again.';
    default:
      return '';
  }
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(mapOAuthError(searchParams.get('error')));
  const [loading, setLoading] = useState(false);
  const [oauthInProgress, setOauthInProgress] = useState(false);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      setError(mapOAuthError(errorCode));
    }

    // Defect G: Reset oauthInProgress when page is restored from bfcache (Back button)
    const handlePageShow = (event) => {
      if (event.persisted) {
        setOauthInProgress(false);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [searchParams]);

  const handleGoogleLogin = () => {
    if (oauthInProgress) {
      return;
    }

    // Defect G: Short 5-second cooldown to avoid button freezing while server rate limits protect endpoints
    const lastAttempt = localStorage.getItem('lastGoogleLoginAttempt');
    const now = Date.now();

    if (lastAttempt && now - Number.parseInt(lastAttempt, 10) < 5 * 1000) {
      setError('Please wait a moment before trying Google sign-in again.');
      return;
    }

    localStorage.setItem('lastGoogleLoginAttempt', String(now));
    setError('');
    setOauthInProgress(true);

    window.location.href = getCustomerGoogleAuthUrl();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      const redirectUrl = searchParams.get('redirect') || '/library';
      navigate(redirectUrl);
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
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-card border border-taupe/50 bg-milk px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-oat disabled:opacity-60"
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
