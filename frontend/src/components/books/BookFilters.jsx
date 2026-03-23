import { useState } from 'react';
import Button from '../common/Button';

export default function BookFilters({ filters, onApply, onClear }) {
  const [local, setLocal] = useState(filters);

  const onChange = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-card border border-taupe/30 bg-oat/60 p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-4">
        <select
          value={local.format || ''}
          onChange={(event) => onChange('format', event.target.value)}
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2 text-sm"
        >
          <option value="">All Formats</option>
          <option value="ebook">eBook</option>
          <option value="physical">Physical</option>
          <option value="audiobook">Audio</option>
        </select>

        <input
          value={local.genre || ''}
          onChange={(event) => onChange('genre', event.target.value)}
          placeholder="Genre"
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2 text-sm"
        />

        <select
          value={local.sort || ''}
          onChange={(event) => onChange('sort', event.target.value)}
          className="rounded-card border border-taupe/50 bg-milk px-3 py-2 text-sm"
        >
          <option value="">Newest</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="title">Title</option>
          <option value="-rating">Top Rated</option>
        </select>

        <input
          type="range"
          min="0"
          max="5000"
          value={local.maxPrice || 5000}
          onChange={(event) => onChange('maxPrice', Number(event.target.value))}
          className="w-full accent-mocha"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onApply(local)}>Apply</Button>
        <Button size="sm" variant="outline" onClick={onClear}>Clear</Button>
      </div>
    </div>
  );
}
