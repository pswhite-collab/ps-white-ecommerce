import Button from '../common/Button';

export default function ReaderControls({
  title,
  settings,
  onSettingsChange,
  onPrev,
  onNext,
  onBack,
  onToggleBookmarks,
}) {
  return (
    <header className="rounded-card border border-taupe/30 bg-milk p-3 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={onBack}>Back</Button>
        <h2 className="mr-auto font-display text-2xl text-mocha">{title || 'Reader'}</h2>
        <Button size="sm" variant="outline" onClick={onPrev}>Prev</Button>
        <Button size="sm" onClick={onNext}>Next</Button>
        <Button size="sm" variant="outline" onClick={onToggleBookmarks}>Bookmarks</Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <select
          value={settings.fontSize}
          onChange={(event) => onSettingsChange({ fontSize: Number(event.target.value) })}
          className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
        >
          <option value={90}>A-</option>
          <option value={100}>A</option>
          <option value={115}>A+</option>
          <option value={130}>A++</option>
        </select>

        <select
          value={settings.fontFamily}
          onChange={(event) => onSettingsChange({ fontFamily: event.target.value })}
          className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
        >
          <option value="Cormorant Garamond">Cormorant Garamond</option>
          <option value="Jost">Jost</option>
          <option value="Georgia">Georgia</option>
          <option value="serif">Serif</option>
        </select>

        <select
          value={settings.theme}
          onChange={(event) => onSettingsChange({ theme: event.target.value })}
          className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="sepia">Sepia</option>
        </select>

        <select
          value={settings.lineSpacing}
          onChange={(event) => onSettingsChange({ lineSpacing: Number(event.target.value) })}
          className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
        >
          <option value={1.3}>Compact</option>
          <option value={1.5}>Normal</option>
          <option value={1.8}>Relaxed</option>
        </select>
      </div>
    </header>
  );
}
