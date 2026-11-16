import Button from '../common/Button';

export default function GoogleLogin({ onClick, label = 'Sign in with Google', disabled = false }) {
  return (
    <section className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
      <h3 className="font-display text-3xl text-mocha">Google Admin Access</h3>
      <p className="mt-2 text-sm text-charcoal/70">Only whitelisted email accounts can access admin tools.</p>
      <Button className="mt-4" onClick={onClick} disabled={disabled}>{label}</Button>
    </section>
  );
}
