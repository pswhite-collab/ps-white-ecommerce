export default function Input({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  const classes = [
    'w-full rounded-card border bg-oat px-4 py-3 text-charcoal shadow-soft outline-none transition-all duration-smooth ease-smooth placeholder:text-charcoal/50 focus:border-mocha focus:ring-2 focus:ring-mocha/30',
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-300' : 'border-taupe/60',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-medium text-charcoal/80">{label}</span> : null}
      <input
        type={type}
        className={classes}
        {...props}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
