import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleLogin from '../../components/admin/GoogleLogin';
import { useAuth } from '../../context/AuthContext';
import { getAdminGoogleAuthUrl } from '../../utils/apiConfig';

const mapAdminOAuthError = (errorCode) => {
  switch (errorCode) {
    case 'access_denied':
      return 'Access denied. Your Google account is not whitelisted for admin access.';
    case 'account_disabled':
      return 'This admin account has been disabled. Please contact the administrator.';
    case 'rate_limited':
      return 'Too many authentication attempts. Please wait a few minutes before trying again.';
    case 'oauth_failed':
      return 'Google sign-in could not be completed. Please try again.';
    case 'oauth_not_configured':
      return 'Google sign-in is not configured on this server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.';
    default:
      return '';
  }
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSessionFromToken, isAdmin, user } = useAuth();
  const [status, setStatus] = useState(mapAdminOAuthError(searchParams.get('error')));
  const [oauthInProgress, setOauthInProgress] = useState(false);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      setStatus(mapAdminOAuthError(errorCode));
    }

    // Defect G: Reset in-progress state when restored from bfcache
    const handlePageShow = (event) => {
      if (event.persisted) {
        setOauthInProgress(false);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [searchParams]);

  const handleAdminGoogleLogin = () => {
    if (oauthInProgress) {
      return;
    }

    // Defect G: 5-second cooldown
    const lastAttempt = localStorage.getItem('lastAdminGoogleLoginAttempt');
    const now = Date.now();

    if (lastAttempt && now - Number.parseInt(lastAttempt, 10) < 5 * 1000) {
      setStatus('Please wait a moment before trying Google sign-in again.');
      return;
    }

    localStorage.setItem('lastAdminGoogleLoginAttempt', String(now));
    setStatus('');
    setOauthInProgress(true);

    window.location.href = getAdminGoogleAuthUrl();
  };

  useEffect(() => {
    // Defect H: Read token from hash fragment first, fallback to query param
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const token = hashParams.get('token') || searchParams.get('token');

    if (!token) {
      return;
    }

    // Immediately remove token from URL to prevent history and referrer leakage
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    const applyToken = async () => {
      try {
        const nextUser = await setSessionFromToken(token);
        if (!nextUser || !['admin', 'super_admin'].includes(nextUser.role)) {
          setStatus('This account does not have admin access.');
          return;
        }
        navigate('/admin/dashboard', { replace: true });
      } catch (error) {
        setStatus(error.message);
      }
    };

    applyToken();
  }, [navigate, searchParams, setSessionFromToken]);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-card border border-taupe/30 bg-milk p-8 shadow-soft">
      <h1 className="font-display text-4xl text-mocha">Admin Login</h1>
      <p className="text-sm text-charcoal/70">
        Sign in with your whitelisted Google account ({user?.email || 'pswhite786@gmail.com'}).
      </p>

      <GoogleLogin
        onClick={handleAdminGoogleLogin}
        label={oauthInProgress ? 'Redirecting to Google...' : 'Sign in with Google'}
        disabled={oauthInProgress}
      />

      {status ? <p className="text-sm text-error">{status}</p> : null}
    </section>
  );
}
