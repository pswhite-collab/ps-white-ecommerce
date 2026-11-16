import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import ePub from 'epubjs';
import { GlobalWorkerOptions, getDocument, version as pdfVersion } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.js`;

const escapeXml = (value = '') =>
  String(value).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return char;
    }
  });

const createWatermarkImage = (text, color) => {
  const safeText = escapeXml(text || 'Licensed Content');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='240'>
    <g transform='translate(30,130) rotate(-24)'>
      <text x='0' y='0' fill='${color}' font-size='18' font-family='Jost, Arial, sans-serif'>${safeText}</text>
    </g>
  </svg>`;

  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

const EbookReader = forwardRef(function EbookReader(
  {
    epubUrl,
    pdfUrl,
    currentPage,
    onPageChange,
    onTotalPages,
    settings,
    watermarkText,
  },
  ref
) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const pdfDocRef = useRef(null);
  const [mode, setMode] = useState(epubUrl ? 'epub' : pdfUrl ? 'pdf' : 'empty');
  const watermarkColor = settings.theme === 'dark' ? 'rgba(251,247,244,0.12)' : 'rgba(104,93,84,0.12)';
  const watermarkBackground = useMemo(
    () => createWatermarkImage(watermarkText, watermarkColor),
    [watermarkColor, watermarkText]
  );

  useEffect(() => {
    setMode(epubUrl ? 'epub' : pdfUrl ? 'pdf' : 'empty');
  }, [epubUrl, pdfUrl]);

  useEffect(() => {
    if (mode !== 'epub' || !epubUrl || !containerRef.current) {
      return undefined;
    }

    const book = ePub(epubUrl);
    const rendition = book.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      manager: 'default',
      flow: 'paginated',
    });

    bookRef.current = book;
    renditionRef.current = rendition;

    const applyTheme = () => {
      rendition.themes.default({
        body: {
          'font-size': `${settings.fontSize || 100}% !important`,
          'font-family': `${settings.fontFamily || 'serif'} !important`,
          'line-height': `${settings.lineSpacing || 1.5} !important`,
          color:
            settings.theme === 'dark'
              ? '#FBF7F4'
              : settings.theme === 'sepia'
                ? '#685D54'
                : '#232323',
          background:
            settings.theme === 'dark'
              ? '#232323'
              : settings.theme === 'sepia'
                ? '#E5DED2'
                : '#FBF7F4',
        },
      });
    };

    book.ready.then(() => {
      applyTheme();
      rendition.display();
    });

    rendition.on('relocated', (location) => {
      const page = location?.start?.displayed?.page || 0;
      const total = location?.start?.displayed?.total || 0;
      onPageChange?.(page);
      onTotalPages?.(total);
    });

    return () => {
      rendition.destroy();
      book.destroy();
    };
  }, [mode, epubUrl]);

  useEffect(() => {
    if (mode !== 'epub' || !renditionRef.current) {
      return;
    }

    renditionRef.current.themes.default({
      body: {
        'font-size': `${settings.fontSize || 100}% !important`,
        'font-family': `${settings.fontFamily || 'serif'} !important`,
        'line-height': `${settings.lineSpacing || 1.5} !important`,
        color:
          settings.theme === 'dark'
            ? '#FBF7F4'
            : settings.theme === 'sepia'
              ? '#685D54'
              : '#232323',
        background:
          settings.theme === 'dark'
            ? '#232323'
            : settings.theme === 'sepia'
              ? '#E5DED2'
              : '#FBF7F4',
      },
    });
  }, [mode, settings]);

  useEffect(() => {
    if (mode !== 'pdf' || !pdfUrl) {
      return undefined;
    }

    let cancelled = false;

    const loadPdf = async () => {
      const task = getDocument(pdfUrl);
      const pdfDoc = await task.promise;
      if (cancelled) {
        return;
      }

      pdfDocRef.current = pdfDoc;
      onTotalPages?.(pdfDoc.numPages || 0);
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [mode, pdfUrl, onTotalPages]);

  useEffect(() => {
    if (mode !== 'pdf' || !pdfDocRef.current || !canvasRef.current) {
      return;
    }

    const renderPage = async () => {
      const pageNumber = Math.max(1, currentPage || 1);
      const page = await pdfDocRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
    };

    renderPage();
  }, [mode, currentPage]);

  useImperativeHandle(ref, () => ({
    next: () => {
      if (mode === 'epub' && renditionRef.current) {
        renditionRef.current.next();
      } else if (mode === 'pdf') {
        onPageChange?.((currentPage || 1) + 1);
      }
    },
    prev: () => {
      if (mode === 'epub' && renditionRef.current) {
        renditionRef.current.prev();
      } else if (mode === 'pdf') {
        onPageChange?.(Math.max(1, (currentPage || 1) - 1));
      }
    },
  }));

  if (mode === 'empty') {
    return (
      <div className="flex h-full items-center justify-center rounded-card border border-dashed border-taupe/50 bg-milk text-charcoal/60">
        Reader content is not available for this title.
      </div>
    );
  }

  return mode === 'epub' ? (
    <div className="relative h-full w-full overflow-hidden rounded-card border border-taupe/30 bg-milk">
      <div ref={containerRef} className="h-full w-full overflow-hidden rounded-card" />
      {watermarkText ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: watermarkBackground,
            backgroundRepeat: 'repeat',
            backgroundSize: '420px 240px',
          }}
        />
      ) : null}
    </div>
  ) : (
    <div className="relative flex h-full w-full items-center justify-center overflow-auto rounded-card border border-taupe/30 bg-oat/50 p-4">
      <canvas ref={canvasRef} className="max-w-full rounded-card bg-milk shadow-soft" />
      {watermarkText ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-card"
          style={{
            backgroundImage: watermarkBackground,
            backgroundRepeat: 'repeat',
            backgroundSize: '420px 240px',
          }}
        />
      ) : null}
    </div>
  );
});

export default EbookReader;
