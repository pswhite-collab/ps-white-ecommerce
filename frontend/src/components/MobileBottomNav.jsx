import { Link, useLocation } from 'react-router-dom';

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
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
