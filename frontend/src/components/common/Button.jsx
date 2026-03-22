const baseStyles =
  'inline-flex items-center justify-center rounded-pill font-medium tracking-wide transition-all duration-smooth ease-smooth focus:outline-none focus:ring-2 focus:ring-mocha/40 disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-mocha text-milk hover:bg-charcoal',
  secondary: 'bg-taupe text-milk hover:bg-mocha',
  outline: 'border-2 border-mocha text-mocha hover:bg-mocha hover:text-milk',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) {
  const classes = [baseStyles, variants[variant], sizes[size], className].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
