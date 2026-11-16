import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookGrid from '../components/books/BookGrid';
import Button from '../components/common/Button';
import bookService from '../services/bookService';
import newsletterService from '../services/newsletterService';
import reviewService from '../services/reviewService';

const formats = [
  {
    icon: 'EP',
    title: 'eBook Editions',
    description:
      'Instant delivery in reader-friendly formats with synced progress and bookmarks across devices.',
    chips: ['EPUB', 'PDF', 'Kindle'],
  },
  {
    icon: 'PB',
    title: 'Physical Books',
    description:
      'Premium print quality and collectible editions with secure international shipping support.',
    chips: ['Hardcover', 'Paperback', 'Signed'],
  },
  {
    icon: 'AB',
    title: 'Audiobooks',
    description:
      'Immersive listening editions crafted for readers who love stories on the move.',
    chips: ['MP3', 'Streaming', 'Offline'],
  },
];

const platforms = [
  { name: 'Amazon', label: 'AMZ' },
  { name: 'Kindle', label: 'KND' },
  { name: 'Apple Books', label: 'APL' },
  { name: 'Google Play', label: 'GGL' },
  { name: 'Audible', label: 'AUD' },
  { name: 'Kobo', label: 'KBO' },
  { name: 'Goodreads', label: 'GRD' },
  { name: 'Scribd', label: 'SCR' },
];

const languageChips = [
  'English',
  'Espanol',
  'Francais',
  'Deutsch',
  'Italiano',
  'Portuguese',
  'Hindi',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Japanese',
  'Chinese',
  'Korean',
  'Arabic',
  'Russian',
  'Turkish',
  'Greek',
  'Thai',
  'Vietnamese',
  'More',
];

const fallbackTestimonials = [
  {
    quote:
      'PS White has a gift for making you feel every sentence. The Weight of Silence stayed with me for days.',
    author: 'Amelia Chen',
    location: 'Singapore',
  },
  {
    quote:
      'I read it in translation and the emotional quality was still exceptional. Truly world-class storytelling.',
    author: 'Mathieu Dubois',
    location: 'France',
  },
  {
    quote:
      'The audiobook edition was extraordinary. It felt intimate, cinematic, and deeply human.',
    author: 'Priya Menon',
    location: 'India',
  },
];

function SectionHeader({ label, title, titleAccent, description, center = false }) {
  return (
    <header className={center ? 'mx-auto max-w-3xl text-center' : ''}>
      <p
        className={[
          'mb-3 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-mocha',
          center ? 'justify-center' : '',
        ].join(' ')}
      >
        <span className="inline-block h-px w-8 bg-mocha" />
        {label}
      </p>
      <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.15] text-charcoal">
        {title}
        {' '}
        <em className="text-mocha">{titleAccent}</em>
      </h2>
      {description ? (
        <p className={['mt-3 text-base leading-relaxed text-mocha/85', center ? 'mx-auto max-w-2xl' : 'max-w-2xl'].join(' ')}>
          {description}
        </p>
      ) : null}
    </header>
  );
}

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState({ type: '', message: '' });
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoadingBooks(true);
      try {
        const featured = await bookService.getFeaturedBooks();
        setBooks(featured);
      } catch (_error) {
        setBooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    loadFeatured();
  }, []);

  useEffect(() => {
    const loadFeaturedReviews = async () => {
      try {
        const reviews = await reviewService.getFeaturedReviews({ limit: 3 });
        setFeaturedReviews(reviews);
      } catch (_error) {
        setFeaturedReviews([]);
      }
    };

    loadFeaturedReviews();
  }, []);

  const testimonials = featuredReviews.length
    ? featuredReviews.map((review) => ({
        quote: review.comment,
        author: `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 'Reader',
        location: review.book?.title || 'PS White Reader',
      }))
    : fallbackTestimonials;

  const onSubscribe = async (event) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      return;
    }

    setSubscribing(true);
    setNewsletterState({ type: '', message: '' });

    try {
      await newsletterService.subscribe(newsletterEmail.trim());
      setNewsletterEmail('');
      setNewsletterState({
        type: 'success',
        message: 'Subscribed successfully. Welcome to the reader circle.',
      });
    } catch (error) {
      setNewsletterState({
        type: 'error',
        message: error.message || 'Subscription failed. Please try again.',
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-[28px] border border-taupe/30 bg-hero-gradient px-6 py-14 shadow-strong sm:px-10 lg:px-14 lg:py-20">
        <div className="pointer-events-none absolute -right-16 -top-20 h-[320px] w-[320px] rounded-full bg-taupe/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-[320px] w-[320px] rounded-full bg-charcoal/10 blur-3xl" />

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
              <span className="inline-block h-px w-10 bg-mocha" />
              Official Author Collection
            </p>
            <h1 className="font-display text-[clamp(2.8rem,7vw,5.2rem)] font-light leading-[1.05] text-charcoal">
              Stories that
              {' '}
              <em className="text-mocha">stay with you</em>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-mocha/90">
              Explore PS White titles across eBook, physical, and audiobook formats with a
              premium reading experience designed for global readers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/books" className="no-underline">
                <Button size="lg">Browse Collection</Button>
              </Link>
              <Link to="/library" className="no-underline">
                <Button size="lg" variant="outline">My Library</Button>
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative h-[420px] w-[300px]">
              <div className="absolute left-1/2 top-8 h-[340px] w-[220px] -translate-x-1/2 rounded-[6px_18px_18px_6px] bg-[linear-gradient(145deg,#232323,#685D54_54%,#A39382)] px-8 py-10 shadow-strong">
                <div className="absolute left-0 top-0 h-full w-4 rounded-l-[6px] bg-gradient-to-r from-black/30 to-transparent" />
                <div className="relative flex h-full flex-col items-center justify-center text-center">
                  <h3 className="font-display text-3xl text-milk">The Weight of Silence</h3>
                  <span className="mt-3 text-[11px] uppercase tracking-[0.16em] text-milk/80">PS White</span>
                  <span className="my-4 inline-block h-px w-14 bg-milk/40" />
                  <p className="text-xs uppercase tracking-[0.16em] text-milk/70">Bestseller</p>
                </div>
              </div>

              <div className="absolute right-0 top-0 rounded-pill bg-milk px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal shadow-soft">
                Multi Format
              </div>
              <div className="absolute bottom-12 left-0 rounded-pill bg-milk px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal shadow-soft">
                Global Delivery
              </div>
              <div className="absolute bottom-1 right-5 rounded-pill bg-milk px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-charcoal shadow-soft">
                50+ Languages
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="grid gap-10 rounded-[24px] bg-oat/45 px-6 py-12 sm:px-10 lg:grid-cols-[0.95fr_1.2fr]">
        <div className="relative mx-auto h-[420px] w-full max-w-[360px]">
          <div className="flex h-full items-center justify-center rounded-[8px_44px_8px_44px] bg-[linear-gradient(135deg,#A39382,#232323)] font-display text-7xl italic text-milk">
            PS
          </div>
          <div className="absolute -bottom-7 -right-4 w-52 rounded-card border-l-4 border-l-mocha bg-milk p-4 shadow-soft">
            <p className="font-display text-lg italic leading-snug text-mocha">
              Writing the quiet truths that readers carry long after the last page.
            </p>
          </div>
        </div>

        <div>
          <SectionHeader
            label="About the Author"
            title="Words shaped by memory,"
            titleAccent="place, and longing"
            description="PS White writes literary fiction rooted in emotional truth, atmosphere, and human complexity. Each story is crafted to resonate across cultures and languages."
          />

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-display text-4xl font-semibold text-mocha">12+</p>
              <p className="text-xs uppercase tracking-[0.12em] text-mocha/80">Books Published</p>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl font-semibold text-mocha">50+</p>
              <p className="text-xs uppercase tracking-[0.12em] text-mocha/80">Languages</p>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl font-semibold text-mocha">1M+</p>
              <p className="text-xs uppercase tracking-[0.12em] text-mocha/80">Readers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] bg-oat px-6 py-12 sm:px-10">
        <SectionHeader
          label="Featured Titles"
          title="The collection readers"
          titleAccent="return to"
          description="A curated shelf of PS White's most-loved books. Available as eBook, physical edition, and audiobook."
        />
        <div className="mt-8">
          <BookGrid books={books} loading={loadingBooks} />
        </div>
      </section>

      <section className="rounded-[24px] border border-taupe/30 bg-milk px-6 py-12 sm:px-10">
        <SectionHeader
          label="Formats"
          title="Choose how you"
          titleAccent="experience stories"
          description="One catalog, multiple experiences. Read digitally, collect physical editions, or listen on the go."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {formats.map((format) => (
            <article
              key={format.title}
              className="rounded-[20px] border border-transparent bg-oat/70 p-6 transition-all duration-smooth ease-smooth hover:-translate-y-1 hover:border-mocha/60 hover:shadow-strong"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-milk text-sm font-semibold uppercase tracking-[0.14em] text-mocha">
                {format.icon}
              </div>
              <h3 className="mt-4 font-display text-3xl text-charcoal">{format.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mocha/85">{format.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {format.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-pill border border-taupe/40 bg-milk px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-mocha"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-oat/60 px-6 py-12 sm:px-10">
        <SectionHeader
          label="Global Platforms"
          title="Available wherever readers"
          titleAccent="already are"
          description="Your audience can discover and purchase books through trusted global storefronts."
          center
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {platforms.map((platform) => (
            <article
              key={platform.name}
              className="rounded-card border border-transparent bg-milk p-4 text-center transition-all duration-smooth ease-smooth hover:-translate-y-1 hover:border-mocha/50 hover:shadow-soft"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[10px] bg-mocha text-xs font-bold uppercase tracking-[0.1em] text-milk">
                {platform.label}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-charcoal">{platform.name}</h3>
              <p className="mt-1 text-xs text-mocha/80">Partner platform</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-oat via-milk to-oat px-6 py-16 sm:px-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-mocha/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-taupe/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-mocha/10">
            <svg className="h-8 w-8 text-mocha" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-mocha">
            Daily Inspiration
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.4rem)] leading-tight text-charcoal">
            Start your day with
            {' '}
            <em className="text-mocha">wisdom</em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-charcoal/85">
            Discover a new quote every day with words of inspiration, motivation, and literary
            depth to accompany your reading journey.
          </p>

          <article className="mx-auto mt-8 max-w-2xl rounded-[20px] border-2 border-mocha/20 bg-milk p-8 shadow-soft">
            <blockquote className="font-display text-2xl italic leading-relaxed text-charcoal">
              "A book is a dream that you hold in your hand."
            </blockquote>
            <p className="mt-4 text-base font-medium text-mocha">- Neil Gaiman</p>
          </article>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('pswhite_last_quote_seen');
              window.dispatchEvent(new Event('showQuotePopup'));
            }}
            className="group mt-8 inline-flex items-center gap-3 rounded-pill bg-mocha px-8 py-4 text-lg font-semibold text-milk shadow-soft transition-all duration-smooth ease-smooth hover:scale-[1.02] hover:bg-charcoal hover:shadow-strong"
          >
            <span>View Today&apos;s Quote</span>
            <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <p className="mt-6 text-xs text-taupe">
            New quote every day • Sourced from renowned authors • Share with friends
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-taupe/30 bg-milk px-6 py-12 text-center sm:px-10">
        <SectionHeader
          label="Languages"
          title="Read in your"
          titleAccent="preferred language"
          description="PS White titles are localized for global readers. Choose language at checkout."
          center
        />
        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
          {languageChips.map((language) => (
            <span
              key={language}
              className="rounded-pill border border-taupe/50 bg-oat px-3 py-1 text-xs font-medium text-mocha transition-all duration-smooth ease-smooth hover:bg-mocha hover:text-milk"
            >
              {language}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-oat px-6 py-12 sm:px-10">
        <SectionHeader
          label="Reader Reviews"
          title="What readers"
          titleAccent="say"
          center
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.author} className="relative rounded-[20px] bg-milk p-6 shadow-soft">
              <span className="pointer-events-none absolute left-4 top-2 font-display text-7xl text-mocha/20">
                "
              </span>
              <p className="relative pt-7 font-display text-xl italic leading-relaxed text-mocha">
                {item.quote}
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-charcoal">{item.author}</p>
                <p className="text-xs text-mocha/80">{item.location}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="rounded-[24px] bg-[linear-gradient(135deg,#232323,#685D54)] px-6 py-14 text-center sm:px-10">
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-light text-oat">
          Join PS White&apos;s Reader Circle
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-oat/80">
          New releases, private excerpts, and special reader-only updates. No spam.
        </p>

        <form
          className="mx-auto mt-8 flex max-w-xl flex-col overflow-hidden rounded-pill bg-milk shadow-strong sm:flex-row"
          onSubmit={onSubscribe}
        >
          <input
            type="email"
            value={newsletterEmail}
            onChange={(event) => setNewsletterEmail(event.target.value)}
            placeholder="Your email address"
            className="h-14 flex-1 border-none bg-milk px-6 text-sm text-charcoal outline-none"
            required
          />
          <button
            type="submit"
            className="h-14 min-w-[170px] border-none bg-mocha px-6 text-xs font-semibold uppercase tracking-[0.14em] text-milk transition-colors duration-smooth ease-smooth hover:bg-mocha-hover disabled:cursor-not-allowed disabled:opacity-70"
            disabled={subscribing}
          >
            {subscribing ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {newsletterState.message ? (
          <p
            className={[
              'mt-4 text-sm',
              newsletterState.type === 'success' ? 'text-success' : 'text-error',
            ].join(' ')}
          >
            {newsletterState.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

