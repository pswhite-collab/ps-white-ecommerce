import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleGoogleSignup = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      setSuccess('Registration successful. Check your email to verify your account.');
      navigate('/library');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-card border border-taupe/30 bg-milk p-8 shadow-soft">
      <h1 className="font-display text-4xl text-mocha">Register</h1>
      <p className="mt-2 text-sm text-charcoal/70">Create your PS White reader account.</p>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-card border border-taupe/50 bg-milk px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-oat"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-milk text-xs text-mocha">G</span>
        Sign up with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-taupe">
        <span className="h-px flex-1 bg-oat" />
        OR
        <span className="h-px flex-1 bg-oat" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(event) => onChange('firstName', event.target.value)}
            required
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(event) => onChange('lastName', event.target.value)}
            required
          />
        </div>

        <Input
          type="email"
          label="Email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
          required
        />
        <Input
          type="password"
          label="Password"
          value={form.password}
          onChange={(event) => onChange('password', event.target.value)}
          required
        />
        <Input
          type="password"
          label="Confirm Password"
          value={form.confirmPassword}
          onChange={(event) => onChange('confirmPassword', event.target.value)}
          required
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {success ? <p className="text-sm text-success">{success}</p> : null}

        <Button className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-charcoal/70">
        Already have an account? <Link to="/login" className="text-mocha underline">Sign in</Link>
      </p>
    </section>
  );
}
