import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Books', to: '/admin/manage-books' },
  { label: 'Customers', to: '/admin/customers' },
  { label: 'Analytics', to: '/admin/analytics' },
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
            end={item.to === '/admin'}
            className={({ isActive }) =>
              [
                'rounded-card px-3 py-2 text-sm transition-colors duration-smooth ease-smooth',
                isActive ? 'bg-mocha text-milk' : 'text-milk/80 hover:bg-mocha/40 hover:text-milk',
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
