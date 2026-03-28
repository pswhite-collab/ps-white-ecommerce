import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Button from '../common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Books', to: '/books' },
  { label: 'Blog', to: '/blog' },
  { label: 'About', to: '/#about', isHashLink: true },
];

export default function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
  }, [location.pathname, location.search]);

  const closeUserMenuAndNavigate = () => {
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-taupe/30 bg-[rgba(251,247,244,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 relative sm:px-6 lg:px-8">

        {/* LEFT SLOT — Nav links */}
        <div className="hidden md:block">
          <div className="flex items-center gap-6">
            {navItems.map((item) =>
              item.isHashLink ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-xs font-medium uppercase tracking-[0.16em] text-mocha no-underline transition-colors duration-smooth ease-smooth hover:text-charcoal"
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'text-xs font-medium uppercase tracking-[0.16em] no-underline transition-colors duration-smooth ease-smooth',
                      isActive ? 'text-charcoal' : 'text-mocha hover:text-charcoal',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </div>
        </div>

        {/* CENTER SLOT — Brand name (absolutely centered) */}
        <div className="absolute left-4 z-20 flex items-center gap-3 md:hidden">
          <NavLink
            to="/books"
            className={({ isActive }) =>
              [
                'text-xs font-medium uppercase tracking-[0.14em] no-underline transition-colors duration-smooth ease-smooth',
                isActive ? 'text-charcoal' : 'text-mocha hover:text-charcoal',
              ].join(' ')
            }
          >
            Books
          </NavLink>
          <Link
            to="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-taupe/60 text-charcoal no-underline transition-colors duration-smooth ease-smooth hover:bg-oat"
            aria-label="Open cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75h1.386c.51 0 .955.343 1.087.835l1.43 5.362a1.5 1.5 0 001.45 1.115h9.794a1.5 1.5 0 001.45-1.115l1.43-5.362a1.125 1.125 0 011.087-.835h1.386M8.25 17.25a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm6 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM6.75 9h10.5" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-mocha px-0.5 text-[9px] font-semibold text-milk">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2">
          <Link
            to="/"
            className="pointer-events-auto font-display text-3xl font-semibold tracking-wide text-charcoal no-underline md:text-5xl"
          >
            PS <span className="text-mocha">White</span>
          </Link>
        </div>

        {/* RIGHT SLOT — Cart + Auth */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-taupe/60 text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal no-underline transition-colors duration-smooth ease-smooth hover:bg-oat"
            aria-label="Open cart"
          >
            Cart
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-mocha px-1 text-[10px] font-semibold text-milk">
              {itemCount}
            </span>
          </Link>

            {!isAuthenticated ? (
              <>
                <Link to="/login" className="no-underline">
                  <Button size="sm" variant="outline">Login</Button>
                </Link>
                <Link to="/register" className="no-underline">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-pill border border-taupe/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-charcoal transition-colors duration-smooth ease-smooth hover:bg-oat"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mocha text-[11px] font-semibold text-milk">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                  Account
                </button>

                {showUserMenu ? (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-card border border-taupe/40 bg-milk p-2 shadow-soft">
                    <Link
                      to="/library"
                      className="block rounded-card px-3 py-2 text-sm text-charcoal no-underline transition-colors hover:bg-oat"
                      onClick={closeUserMenuAndNavigate}
                    >
                      My Library
                    </Link>
                    {['admin', 'super_admin'].includes(user?.role) ? (
                      <Link
                        to="/admin/dashboard"
                        className="block rounded-card px-3 py-2 text-sm text-charcoal no-underline transition-colors hover:bg-oat"
                        onClick={closeUserMenuAndNavigate}
                      >
                        Admin Panel
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="mt-1 w-full rounded-card px-3 py-2 text-left text-sm text-charcoal transition-colors hover:bg-oat"
                      onClick={async () => {
                        closeUserMenuAndNavigate();
                        await logout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className="relative z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-taupe/60 text-charcoal md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
        >
          <span className="text-lg leading-none">{isMenuOpen ? 'x' : '|||'} </span>
        </button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-taupe/30 bg-milk px-4 py-4 shadow-soft md:hidden">
          <div className="flex flex-col gap-3">
            {navItems
              .filter((item) => item.label !== 'Books')
              .map((item) =>
              item.isHashLink ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-card px-3 py-2 text-sm font-medium uppercase tracking-[0.12em] text-mocha no-underline transition-colors hover:bg-oat hover:text-charcoal"
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-card px-3 py-2 text-sm font-medium uppercase tracking-[0.12em] no-underline transition-colors',
                      isActive
                        ? 'bg-oat text-charcoal'
                        : 'text-mocha hover:bg-oat hover:text-charcoal',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/library"
                  className="rounded-card px-3 py-2 text-sm text-charcoal no-underline hover:bg-oat"
                >
                  My Library
                </Link>
                <button
                  type="button"
                  className="rounded-card px-3 py-2 text-left text-sm text-charcoal hover:bg-oat"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-card px-3 py-2 text-sm text-charcoal no-underline hover:bg-oat">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-card px-3 py-2 text-sm text-charcoal no-underline hover:bg-oat"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
