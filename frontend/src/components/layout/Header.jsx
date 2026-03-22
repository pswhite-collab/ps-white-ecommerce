import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Button from '../common/Button';
import { useCart } from '../../context/CartContext';

const navItems = [
  { label: 'BOOKS', to: '/books' },
  { label: 'ABOUT', to: '/#about' },
  { label: 'BLOG', to: '/#blog' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-taupe/35 bg-[rgba(251,247,244,0.9)] backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-3xl font-semibold tracking-wide text-mocha">
          PS White
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  'text-sm font-medium tracking-[0.18em] transition-colors duration-smooth ease-smooth',
                  isActive ? 'text-mocha' : 'text-charcoal/75 hover:text-mocha',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-taupe/60 text-charcoal transition-colors hover:bg-oat"
            aria-label="Shopping cart"
          >
            <span className="text-lg">??</span>
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-mocha px-1 text-xs text-milk">
              {itemCount}
            </span>
          </Link>
          <Link to="/library">
            <Button size="sm">My Library</Button>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-taupe/60 text-charcoal md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Open menu"
        >
          <span className="text-lg">?</span>
        </button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-taupe/30 bg-milk px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-card px-3 py-2 font-medium text-charcoal transition-colors hover:bg-oat hover:text-mocha"
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="rounded-card px-3 py-2 text-charcoal hover:bg-oat">
              Cart ({itemCount})
            </Link>
            <Link to="/library" onClick={() => setIsMenuOpen(false)} className="rounded-card px-3 py-2 text-charcoal hover:bg-oat">
              My Library
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
