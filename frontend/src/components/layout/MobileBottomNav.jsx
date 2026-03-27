import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const tabs = [
  {
    label: 'Home',
    to: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.092 0L22.25 12M4.5 9.75V21a.75.75 0 00.75.75H9a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21a.75.75 0 00.75.75h3.75a.75.75 0 00.75-.75V9.75" />
      </svg>
    ),
  },
  {
    label: 'Books',
    to: '/books',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    label: 'Cart',
    to: '/cart',
    isCart: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    label: 'Library',
    to: '/library',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-taupe/30 bg-[rgba(251,247,244,0.9)] backdrop-blur-xl md:hidden"
      style={{ height: '64px' }}
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.to === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.to);

        return (
          <Link
            key={tab.label}
            to={tab.to}
            className={[
              'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-[0.1em] no-underline transition-colors',
              isActive ? 'text-[#C9A84C]' : 'text-mocha hover:text-charcoal',
            ].join(' ')}
            style={{ minWidth: '56px' }}
          >
            {tab.isCart ? (
              <span className="relative">
                {tab.icon}
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-mocha px-0.5 text-[9px] font-semibold text-milk">
                    {itemCount}
                  </span>
                )}
              </span>
            ) : (
              tab.icon
            )}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
