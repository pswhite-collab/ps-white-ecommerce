export default function Input({
  label,
  error,
  success,
  type = 'text',
  className = '',
  ...props
}) {
  const classes = [
    'w-full rounded-card border-2 bg-oat px-4 py-3 text-charcoal shadow-soft outline-none transition-all duration-smooth ease-smooth placeholder:text-taupe focus:border-mocha focus:ring-2 focus:ring-mocha/30',
    error
      ? 'border-error focus:border-error focus:ring-error/30'
      : success
        ? 'border-success focus:border-success focus:ring-success/30'
        : 'border-taupe',
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
      {error ? <span className="text-sm text-error">{error}</span> : null}
      {!error && success ? <span className="text-sm text-success">{success}</span> : null}
    </label>
  );
}
