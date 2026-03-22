import Card from '../common/Card';
import Button from '../common/Button';

export default function GoogleLogin() {
  return (
    <Card>
      <h3 className="font-display text-2xl text-mocha">Google Admin Login</h3>
      <p className="mt-2 text-charcoal/70">Google OAuth button placeholder.</p>
      <Button className="mt-4" variant="outline">Continue with Google</Button>
    </Card>
  );
}
