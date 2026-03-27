import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 016 3h11.25a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0117.25 21H6a2.25 2.25 0 01-2.25-2.25V5.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h7.5M7.5 11.25h7.5M7.5 15h5.25" />
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
    label: 'My Library',
    to: '/library',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 018.25 19.5H6a2.25 2.25 0 01-2.25-2.25V6.75zM13.5 5.25A1.5 1.5 0 0115 3.75h3a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5V5.25z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-taupe/30 bg-[rgba(251,247,244,0.9)] backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const isActive = tab.to === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.to);

        return (
          <Link
            key={tab.label}
            to={tab.to}
            className={[
              'relative flex min-w-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-[0.1em] no-underline transition-colors',
              isActive ? 'text-[#C9A84C]' : 'text-mocha hover:text-charcoal',
            ].join(' ')}
          >
            {tab.isCart ? (
              <span className="relative">
                {tab.icon}
                {itemCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-mocha px-0.5 text-[9px] font-semibold text-milk">
                    {itemCount}
                  </span>
                ) : null}
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
