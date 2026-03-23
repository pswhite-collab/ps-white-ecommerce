import { Link } from 'react-router-dom';

const bookLinks = [
  { label: 'The Weight of Silence', to: '/books' },
  { label: 'Between Two Dawns', to: '/books' },
  { label: 'A Garden of Echoes', to: '/books' },
  { label: 'Letters to the Unsent', to: '/books' },
  { label: 'All Books', to: '/books' },
];

const shopLinks = [
  { label: 'eBooks', to: '/books' },
  { label: 'Physical Books', to: '/books' },
  { label: 'Audiobooks', to: '/books' },
  { label: 'Signed Copies', to: '/books' },
  { label: 'Gift Cards', to: '/books' },
];

const infoLinks = [
  { label: 'About PS White', to: '/#about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Events', to: '/blog' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
];

const socialItems = [
  { label: 'IG', href: '#' },
  { label: 'X', href: '#' },
  { label: 'FB', href: '#' },
  { label: 'TT', href: '#' },
  { label: 'GR', href: '#' },
];

function FooterColumn({ title, links }) {
  return (
    <section>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal">{title}</h4>
      <ul className="space-y-2">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="text-sm text-mocha no-underline transition-colors duration-smooth ease-smooth hover:text-charcoal"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-taupe/40 bg-milk">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-8">
        <section>
          <Link to="/" className="font-display text-3xl font-semibold tracking-wide text-charcoal no-underline">
            PS <span className="text-mocha">White</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mocha/85">
            Official website of PS White. Discover literary fiction in eBook, physical, and audio
            formats with global access and secure checkout.
          </p>

          <div className="mt-5 flex items-center gap-2">
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-taupe/50 bg-oat text-xs font-semibold text-mocha no-underline transition-all duration-smooth ease-smooth hover:-translate-y-0.5 hover:bg-mocha hover:text-milk"
                aria-label={item.label}
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <FooterColumn title="Books" links={bookLinks} />
        <FooterColumn title="Shop" links={shopLinks} />
        <FooterColumn title="Info" links={infoLinks} />
      </div>

      <div className="border-t border-taupe/40">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-mocha/80 sm:px-6 lg:px-8">
          <p>(c) {new Date().getFullYear()} PS White. All rights reserved.</p>
          <p className="text-right">
            <span className="text-taupe">Powered by </span>
            <a
              href="https://zeroops.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-mocha no-underline transition-colors duration-smooth ease-smooth hover:text-charcoal"
            >
              ZERO
            </a>
            {' '}
            <span className="text-taupe">|</span>
            {' '}
            <a
              href="https://zeroops.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-taupe no-underline transition-colors duration-smooth ease-smooth hover:text-mocha"
            >
              zeroops.in
            </a>
            {' '}
            <span className="text-taupe">|</span>
            {' '}
            <Link to="/terms" className="text-mocha no-underline hover:text-charcoal">Terms</Link>
            {' '}
            <span className="text-taupe">|</span>
            {' '}
            <Link to="/privacy" className="text-mocha no-underline hover:text-charcoal">Privacy</Link>
            {' '}
            <span className="text-taupe">|</span>
            {' '}
            <Link to="/sitemap" className="text-mocha no-underline hover:text-charcoal">Sitemap</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
