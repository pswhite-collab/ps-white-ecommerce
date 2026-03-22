import { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}) {
  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onEsc);
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-card bg-milk p-6 shadow-strong transition-all duration-smooth ease-smooth"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl text-mocha">{title}</h2>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-taupe/50 text-charcoal transition-colors hover:bg-oat"
            onClick={onClose}
            aria-label="Close modal"
          >
            X
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
