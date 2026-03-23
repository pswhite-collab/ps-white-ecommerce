import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

const STORAGE_KEY = 'pswhite_last_quote_seen';

export default function QuotePopup() {
  const location = useLocation();
  const [quote, setQuote] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadQuote = useCallback(
    async (forceShow = false) => {
      if (location.pathname.startsWith('/admin')) {
        return;
      }

      const today = new Date().toDateString();
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      if (!forceShow && lastSeen === today) {
        return;
      }

      try {
        const response = await api.get('/quotes/today');
        if (response.data?.success && response.data?.data) {
          setQuote(response.data.data);
          setIsOpen(true);
        }
      } catch (_error) {
        setQuote(null);
      }
    },
    [location.pathname]
  );

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  useEffect(() => {
    const onShowQuotePopup = () => {
      loadQuote(true);
    };

    window.addEventListener('showQuotePopup', onShowQuotePopup);
    return () => {
      window.removeEventListener('showQuotePopup', onShowQuotePopup);
    };
  }, [loadQuote]);

  const closePopup = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  };

  if (!isOpen || !quote) {
    return null;
  }

  return (
    <>
      <div
        className="animate-fadeIn fixed inset-0 z-50 bg-charcoal/55 backdrop-blur-sm"
        onClick={closePopup}
        role="presentation"
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <section
          className="animate-slideUp pointer-events-auto relative w-full max-w-xl rounded-card border border-taupe/30 bg-milk p-8 shadow-strong"
          onClick={(event) => event.stopPropagation()}
          aria-labelledby="quote-popup-title"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closePopup}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-taupe/40 text-charcoal transition-colors hover:bg-oat"
            aria-label="Close quote popup"
          >
            X
          </button>

          <div className="text-center">
            <p className="mb-3 inline-flex rounded-pill bg-oat px-3 py-1 text-xs uppercase tracking-wide text-mocha">
              Daily Inspiration
            </p>
            <h2 id="quote-popup-title" className="font-display text-3xl text-mocha">
              Quote of the Day
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-mocha/30" />
          </div>

          <blockquote className="mt-6 text-center">
            <p className="font-display text-2xl leading-relaxed text-charcoal">"{quote.text}"</p>
            <footer className="mt-4 text-base text-mocha">- {quote.author || 'PS White'}</footer>
          </blockquote>

          {quote.category && quote.category !== 'general' ? (
            <div className="mt-4 text-center">
              <span className="inline-flex rounded-pill bg-oat px-3 py-1 text-xs capitalize text-mocha">
                {quote.category}
              </span>
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={closePopup}
              className="rounded-pill bg-mocha px-6 py-2 text-sm font-medium text-milk transition-colors hover:bg-mocha-hover"
            >
              Continue Reading
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
