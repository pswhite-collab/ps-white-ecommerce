import { useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '../common/Button';
import Input from '../common/Input';

const defaultForm = {
  title: '',
  subtitle: '',
  author: 'PS White',
  description: '',
  excerpt: '',
  genres: '',
  languages: 'English',
  featured: false,
  active: true,
  formats: {
    ebook: { available: true, price: 0, pageCount: 0 },
    physical: {
      available: false,
      price: 0,
      stock: 0,
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      isbn: '',
      publisher: '',
      publicationDate: '',
      binding: 'Paperback',
      pages: 0,
      language: 'English',
    },
    audiobook: { available: false, price: 0 },
  },
};

const normalizeNumber = (value) => Number.parseFloat(value || '0') || 0;

const mergeInitialForm = (initialValue = {}) => ({
  ...defaultForm,
  ...initialValue,
  genres: Array.isArray(initialValue.genres) ? initialValue.genres.join(', ') : defaultForm.genres,
  languages: Array.isArray(initialValue.languages)
    ? initialValue.languages.join(', ')
    : defaultForm.languages,
  formats: {
    ebook: {
      ...defaultForm.formats.ebook,
      ...(initialValue.formats?.ebook || {}),
    },
    physical: {
      ...defaultForm.formats.physical,
      ...(initialValue.formats?.physical || {}),
      dimensions: {
        ...defaultForm.formats.physical.dimensions,
        ...(initialValue.formats?.physical?.dimensions || {}),
      },
      publicationDate: initialValue.formats?.physical?.publicationDate
        ? new Date(initialValue.formats.physical.publicationDate).toISOString().slice(0, 10)
        : '',
    },
    audiobook: {
      ...defaultForm.formats.audiobook,
      ...(initialValue.formats?.audiobook || {}),
    },
  },
});

export default function BookForm({
  initialValue,
  onSubmit,
  onClose,
  submitting,
}) {
  const [form, setForm] = useState(defaultForm);
  const [coverFile, setCoverFile] = useState(null);
  const [epubFile, setEpubFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    if (initialValue) {
      setForm(mergeInitialForm(initialValue));
    } else {
      setForm(defaultForm);
    }
  }, [initialValue]);

  const onDropCover = useMemo(
    () => (accepted) => {
      if (accepted?.length) setCoverFile(accepted[0]);
    },
    []
  );

  const coverDropzone = useDropzone({ onDrop: onDropCover, multiple: false, accept: { 'image/*': [] } });

  const setNested = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      let target = next;
      for (let i = 0; i < path.length - 1; i += 1) {
        target = target[path[i]];
      }
      target[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const physicalPublicationDate = form.formats.physical.publicationDate
      ? new Date(form.formats.physical.publicationDate).toISOString()
      : null;

    const formData = new FormData();

    // Text / boolean fields
    formData.append('title', (form.title || '').trim());
    formData.append('subtitle', (form.subtitle || '').trim());
    formData.append('author', (form.author || 'PS White').trim());
    formData.append('description', form.description || '');
    formData.append('excerpt', form.excerpt || '');
    formData.append('featured', String(Boolean(form.featured)));
    formData.append('active', String(Boolean(form.active)));

    // Arrays → JSON strings (back-end parses these)
    formData.append(
      'genres',
      JSON.stringify(form.genres.split(',').map((g) => g.trim()).filter(Boolean))
    );
    formData.append(
      'languages',
      JSON.stringify(form.languages.split(',').map((l) => l.trim()).filter(Boolean))
    );

    // Formats → single JSON blob so Joi can still validate structure
    const formats = {
      ebook: {
        available: Boolean(form.formats.ebook.available),
        price: Number(form.formats.ebook.price) || 0,
        pageCount: Number(form.formats.ebook.pageCount) || 0,
      },
      physical: {
        available: Boolean(form.formats.physical.available),
        price: Number(form.formats.physical.price) || 0,
        stock: Number(form.formats.physical.stock) || 0,
        weight: Number(form.formats.physical.weight) || 0,
        pages: Number(form.formats.physical.pages) || 0,
        publicationDate: physicalPublicationDate,
        isbn: (form.formats.physical.isbn || '').trim(),
        publisher: (form.formats.physical.publisher || '').trim(),
        binding: form.formats.physical.binding || 'Paperback',
        language: (form.formats.physical.language || 'English').trim(),
        dimensions: {
          length: Number(form.formats.physical.dimensions.length) || 0,
          width: Number(form.formats.physical.dimensions.width) || 0,
          height: Number(form.formats.physical.dimensions.height) || 0,
        },
      },
      audiobook: {
        available: Boolean(form.formats.audiobook.available),
        price: Number(form.formats.audiobook.price) || 0,
      },
    };
    formData.append('formats', JSON.stringify(formats));

    // File attachments
    if (coverFile) formData.append('coverImage', coverFile);
    if (epubFile)  formData.append('epubFile', epubFile);
    if (pdfFile)   formData.append('pdfFile', pdfFile);
    if (audioFile) formData.append('audioFile', audioFile);

    await onSubmit(formData);
    onClose?.();
  };


  return (
    <form id="bookForm" onSubmit={handleSubmit} className="flex max-h-[60vh] md:max-h-[70vh] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
          <Input label="Subtitle" value={form.subtitle} onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))} />
          <Input label="Author" value={form.author} onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))} />
          <Input label="Genres (comma separated)" value={form.genres} onChange={(event) => setForm((prev) => ({ ...prev, genres: event.target.value }))} />
          <Input label="Languages (comma separated)" value={form.languages} onChange={(event) => setForm((prev) => ({ ...prev, languages: event.target.value }))} />
        </div>

        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-charcoal/80">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-card border-2 border-taupe bg-oat px-4 py-3 text-charcoal shadow-soft outline-none transition-all duration-smooth ease-smooth placeholder:text-taupe focus:border-mocha focus:ring-2 focus:ring-mocha/30"
            rows={4}
          />
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-charcoal/80">Excerpt</span>
          <textarea
            value={form.excerpt}
            onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
            className="w-full rounded-card border-2 border-taupe bg-oat px-4 py-3 text-charcoal shadow-soft outline-none transition-all duration-smooth ease-smooth placeholder:text-taupe focus:border-mocha focus:ring-2 focus:ring-mocha/30"
            rows={3}
          />
        </label>

        <div className="rounded-card border border-taupe/30 bg-oat/40 p-3">
          <p className="mb-2 text-sm font-medium text-charcoal/80">Cover Upload</p>
          <div {...coverDropzone.getRootProps()} className="cursor-pointer rounded-card border border-dashed border-taupe/60 bg-milk p-4 text-sm text-charcoal/70">
            <input {...coverDropzone.getInputProps()} />
            {coverFile ? `Selected: ${coverFile.name}` : 'Drop cover image here or click to upload'}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="rounded-card border border-taupe/30 bg-oat/40 p-3 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))} className="mr-2" />
            Featured
          </label>
          <label className="rounded-card border border-taupe/30 bg-oat/40 p-3 text-sm">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} className="mr-2" />
            Active
          </label>
          <label className="rounded-card border border-taupe/30 bg-oat/40 p-3 text-sm">
            <input type="checkbox" checked={form.formats.ebook.available} onChange={(event) => setNested(['formats', 'ebook', 'available'], event.target.checked)} className="mr-2" />
            eBook Available
          </label>
        </div>

        {form.formats.ebook.available ? (
          <div className="rounded-card border border-taupe/30 bg-oat/40 p-4">
            <h3 className="mb-3 text-base font-semibold text-charcoal">eBook</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input type="number" label="eBook Price" value={form.formats.ebook.price} onChange={(event) => setNested(['formats', 'ebook', 'price'], event.target.value)} />
              <Input type="number" label="Page Count" value={form.formats.ebook.pageCount} onChange={(event) => setNested(['formats', 'ebook', 'pageCount'], event.target.value)} />
              <Input type="file" label="EPUB File" accept=".epub" onChange={(event) => setEpubFile(event.target.files?.[0] || null)} />
              <Input type="file" label="PDF File" accept=".pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} />
            </div>
          </div>
        ) : null}

        <div className="rounded-card border border-taupe/30 bg-oat/40 p-4">
          <label className="mb-3 inline-flex items-center text-sm font-medium text-charcoal">
            <input
              type="checkbox"
              checked={form.formats.physical.available}
              onChange={(event) => setNested(['formats', 'physical', 'available'], event.target.checked)}
              className="mr-2"
            />
            Physical Book Available
          </label>

          {form.formats.physical.available ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  step="0.01"
                  label="Physical Price (GBP)"
                  value={form.formats.physical.price}
                  onChange={(event) => setNested(['formats', 'physical', 'price'], event.target.value)}
                  required
                />
                <Input
                  type="number"
                  min="0"
                  label="Stock Quantity"
                  value={form.formats.physical.stock}
                  onChange={(event) => setNested(['formats', 'physical', 'stock'], event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex w-full flex-col gap-2">
                  <span className="text-sm font-medium text-charcoal/80">Binding Type</span>
                  <select
                    value={form.formats.physical.binding}
                    onChange={(event) => setNested(['formats', 'physical', 'binding'], event.target.value)}
                    className="w-full rounded-card border-2 border-taupe bg-oat px-4 py-3 text-charcoal shadow-soft outline-none transition-all duration-smooth ease-smooth focus:border-mocha focus:ring-2 focus:ring-mocha/30"
                    required
                  >
                    <option value="Paperback">Paperback</option>
                    <option value="Hardcover">Hardcover</option>
                    <option value="Mass Market Paperback">Mass Market Paperback</option>
                  </select>
                </label>
                <Input
                  type="number"
                  label="Pages"
                  value={form.formats.physical.pages}
                  onChange={(event) => setNested(['formats', 'physical', 'pages'], event.target.value)}
                />
              </div>

              <Input
                type="number"
                min="0"
                label="Weight (grams)"
                value={form.formats.physical.weight}
                onChange={(event) => setNested(['formats', 'physical', 'weight'], event.target.value)}
                required
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  type="number"
                  step="0.1"
                  label="Length (cm)"
                  value={form.formats.physical.dimensions.length}
                  onChange={(event) => setNested(['formats', 'physical', 'dimensions', 'length'], event.target.value)}
                />
                <Input
                  type="number"
                  step="0.1"
                  label="Width (cm)"
                  value={form.formats.physical.dimensions.width}
                  onChange={(event) => setNested(['formats', 'physical', 'dimensions', 'width'], event.target.value)}
                />
                <Input
                  type="number"
                  step="0.1"
                  label="Height (cm)"
                  value={form.formats.physical.dimensions.height}
                  onChange={(event) => setNested(['formats', 'physical', 'dimensions', 'height'], event.target.value)}
                />
              </div>

              <Input
                label="ISBN"
                value={form.formats.physical.isbn}
                onChange={(event) => setNested(['formats', 'physical', 'isbn'], event.target.value)}
                placeholder="978-3-16-148410-0"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Publisher"
                  value={form.formats.physical.publisher}
                  onChange={(event) => setNested(['formats', 'physical', 'publisher'], event.target.value)}
                />
                <Input
                  type="date"
                  label="Publication Date"
                  value={form.formats.physical.publicationDate}
                  onChange={(event) => setNested(['formats', 'physical', 'publicationDate'], event.target.value)}
                />
              </div>

              <Input
                label="Language"
                value={form.formats.physical.language}
                onChange={(event) => setNested(['formats', 'physical', 'language'], event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-card border border-taupe/30 bg-oat/40 p-4">
          <label className="mb-3 inline-flex items-center text-sm font-medium text-charcoal">
            <input
              type="checkbox"
              checked={form.formats.audiobook.available}
              onChange={(event) => setNested(['formats', 'audiobook', 'available'], event.target.checked)}
              className="mr-2"
            />
            Audiobook Available
          </label>

          {form.formats.audiobook.available ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                step="0.01"
                label="Audiobook Price (GBP)"
                value={form.formats.audiobook.price}
                onChange={(event) => setNested(['formats', 'audiobook', 'price'], event.target.value)}
              />
              <Input
                type="file"
                label="Audio File (MP3/M4A)"
                accept=".mp3,.m4a,.m4b"
                onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-oat bg-milk pt-4">
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Book'}</Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
