import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSessionFromToken } = useAuth();

  useEffect(() => {
    const finalizeGoogleLogin = async () => {
      // Defect H: Read token from fragment (#token=) first, with backwards-compatible query string fallback
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const token = hashParams.get('token') || searchParams.get('token');

      // Immediately strip the token from the visible URL to prevent history and referrer leakage
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      if (!token) {
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }

      try {
        const user = await setSessionFromToken(token);
        if (!user) {
          navigate('/login?error=oauth_failed', { replace: true });
          return;
        }

        if (['admin', 'super_admin'].includes(user.role)) {
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        navigate('/library', { replace: true });
      } catch (_error) {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    finalizeGoogleLogin();
  }, [navigate, searchParams, setSessionFromToken]);

  return (
    <section className="mx-auto max-w-lg rounded-card border border-taupe/30 bg-milk p-8 text-center shadow-soft">
      <h1 className="font-display text-4xl text-mocha">Completing Sign In</h1>
      <p className="mt-2 text-sm text-charcoal/70">Please wait while we finish your Google login.</p>
    </section>
  );
}
