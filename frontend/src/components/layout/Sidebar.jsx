import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Books', to: '/admin/manage-books' },
  { label: 'Customers', to: '/admin/customers' },
  { label: 'Reading Analytics', to: '/admin/reading-analytics' },
  { label: 'Quote of the Day', to: '/admin/quotes' },
  { label: 'Reviews', to: '/admin/reviews' },
  { label: 'Blog', to: '/admin/blog' },
  { label: 'Newsletter', to: '/admin/newsletter' },
  { label: 'Settings', to: '/admin/settings' },
];

export default function Sidebar() {
  return (
    <aside className="h-fit rounded-card bg-charcoal p-4 text-milk shadow-strong">
      <h2 className="mb-4 px-3 font-display text-2xl">Admin</h2>
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              [
                'rounded-card px-3 py-2 text-sm transition-colors duration-smooth ease-smooth',
                isActive ? 'bg-mocha text-milk' : 'text-taupe hover:bg-mocha/50 hover:text-milk',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
