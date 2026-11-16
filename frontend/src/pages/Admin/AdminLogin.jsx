import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleLogin from '../../components/admin/GoogleLogin';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSessionFromToken, isAdmin, user } = useAuth();
  const [status, setStatus] = useState('');
  const [oauthInProgress, setOauthInProgress] = useState(false);

  const handleAdminGoogleLogin = () => {
    if (oauthInProgress) {
      return;
    }

    const lastAttempt = localStorage.getItem('lastAdminGoogleLoginAttempt');
    const now = Date.now();

    if (lastAttempt && now - Number.parseInt(lastAttempt, 10) < 60 * 1000) {
      setStatus('Please wait a moment before trying Google sign-in again.');
      return;
    }

    localStorage.setItem('lastAdminGoogleLoginAttempt', String(now));
    setStatus('');
    setOauthInProgress(true);

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const origin = apiBase.replace('/api', '');
    window.location.href = `${origin}/api/admin/auth/google`;
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      return;
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

      <GoogleLogin onClick={handleAdminGoogleLogin} label={oauthInProgress ? 'Redirecting to Google...' : 'Sign in with Google'} disabled={oauthInProgress} />

      {status ? <p className="text-sm text-error">{status}</p> : null}
    </section>
  );
}
