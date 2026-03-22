import Button from '../common/Button';
import Input from '../common/Input';

export default function Footer() {
  return (
    <footer className="mt-14 bg-charcoal text-milk">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <section>
          <h3 className="font-display text-3xl">PS White</h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-milk/75">
            Stories crafted for readers who love reflection, growth, and immersive journeys.
          </p>
        </section>

        <section>
          <h4 className="font-display text-2xl">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a className="text-taupe transition-colors hover:text-milk" href="/books">Books</a></li>
            <li><a className="text-taupe transition-colors hover:text-milk" href="/library">My Library</a></li>
            <li><a className="text-taupe transition-colors hover:text-milk" href="/#blog">Blog</a></li>
            <li><a className="text-taupe transition-colors hover:text-milk" href="/#contact">Contact</a></li>
          </ul>
        </section>

        <section>
          <h4 className="font-display text-2xl">Newsletter</h4>
          <div className="mt-4 space-y-3">
            <Input type="email" placeholder="Enter your email" className="!bg-oat !text-charcoal" />
            <Button className="w-full">Subscribe</Button>
          </div>
          <div className="mt-5 flex items-center gap-3 text-xs text-taupe">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-taupe/50">IG</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-taupe/50">FB</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-taupe/50">YT</span>
          </div>
        </section>
      </div>

      <div className="border-t border-taupe/25 py-4 text-center text-xs text-milk/70">
        © {new Date().getFullYear()} PS White. All rights reserved.
      </div>
    </footer>
  );
}
