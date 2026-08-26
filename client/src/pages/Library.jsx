import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { EmptyState } from '../components/Shared.jsx';
import { Button } from '../components/UI.jsx';
import { StaggerGrid, StaggerItem } from '../components/Motion.jsx';

export default function LibraryPage() {
  const [resources, setResources] = useState(null);

  const load = useCallback(async () => setResources(await api('GET', '/resources/me/library')), []);
  useEffect(() => { load(); }, [load]);

  async function removeSaved(id) {
    await api('DELETE', `/resources/${id}/save`);
    setResources(prev => prev.filter(r => r.id !== id));
  }

  if (resources === null) return null;

  return (
    <div>
      <div className="mb-[18px]">
        <span className="font-mono text-[0.72rem] uppercase tracking-wider text-signal">Saved for later</span>
        <h2 className="text-2xl">Your resource library</h2>
      </div>
      {resources.length === 0 && <EmptyState glyph="📚" title="Your library is empty, for now" sub="Every mentor's profile has resources you can save here in one tap." />}
      <StaggerGrid>
        {resources.map(r => (
          <StaggerItem key={r.id}>
            <div className="mb-2 flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-3">
              <div>
                <a className="font-semibold" href={r.link} target="_blank" rel="noreferrer">{r.title}</a>
                <div className="mt-0.5 text-xs text-text-muted">Shared by {r.mentor_name}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {r.tags.map(t => <span key={t.id} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">{t.name}</span>)}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeSaved(r.id)}>Remove</Button>
            </div>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </div>
  );
}
