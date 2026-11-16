export default function Card({
  children,
  hover = false,
  className = '',
  ...props
}) {
  const classes = [
    'rounded-card border border-taupe/25 bg-milk p-5 shadow-soft transition-all duration-smooth ease-smooth',
    hover ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-oat hover:shadow-strong' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={classes}
      {...props}
    >
      {children}
    </article>
  );
}
