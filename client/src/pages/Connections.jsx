import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { EmptyState, Avatar } from '../components/Shared.jsx';
import { Button, StatusPill } from '../components/UI.jsx';
import { StaggerGrid, StaggerItem, ConnectionLockOn } from '../components/Motion.jsx';

function ConnRow({ m, me, onChanged, onAccepted }) {
  const navigate = useNavigate();
  const toast = useToast();
  const isMentor = m.mentor_id === me.id;
  const other = isMentor ? m.mentee : m.mentor;

  async function accept() {
    await api('PATCH', `/matches/${m.id}/status`, { status: 'accepted' });
    onAccepted();
  }
  async function decline() {
    await api('PATCH', `/matches/${m.id}/status`, { status: 'declined' });
    toast('Declined');
    onChanged();
  }

  return (
    <StaggerItem>
      <div className="mb-2.5 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-signal-dim sm:flex-row sm:items-center sm:justify-between">
        <div
          className={`flex items-center gap-3 ${m.status === 'accepted' ? 'cursor-pointer' : ''}`}
          onClick={() => { if (m.status === 'accepted') navigate(`/chat/${m.id}`); }}
        >
          <Avatar name={other.name} size={38} />
          <div>
            <div className="font-semibold">{other.name}</div>
            <div className="text-sm text-text-muted">{m.intro_message || (isMentor ? 'wants to connect' : 'Sent — waiting on a reply')}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill status={m.status} />
          {m.status === 'pending' && isMentor && (
            <>
              <Button size="sm" onClick={accept}>Accept</Button>
              <Button size="sm" variant="danger" onClick={decline}>Decline</Button>
            </>
          )}
          {m.status === 'accepted' && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/chat/${m.id}`)}>Open chat</Button>
          )}
        </div>
      </div>
    </StaggerItem>
  );
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState(null);
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    const rows = await api('GET', '/matches');
    setMatches(rows);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleAccepted() {
    setCelebrating(true);
    load();
  }

  if (matches === null) return null;

  if (!matches.length) {
    return (
      <div>
        <Header />
        <EmptyState glyph="🔗" title="Nobody's on your radar yet" sub="Go browse mentors and say hi — the first message is always the hardest part." />
      </div>
    );
  }

  const pending = matches.filter(m => m.status === 'pending');
  const accepted = matches.filter(m => m.status === 'accepted');
  const past = matches.filter(m => ['declined', 'archived'].includes(m.status));

  return (
    <div>
      <Header />
      {pending.length > 0 && (
        <>
          <h3>Pending</h3>
          <StaggerGrid className="mb-2">{pending.map(m => <ConnRow key={m.id} m={m} me={user} onChanged={load} onAccepted={handleAccepted} />)}</StaggerGrid>
        </>
      )}
      {accepted.length > 0 && (
        <>
          <h3 className="mt-5">Active</h3>
          <StaggerGrid className="mb-2">{accepted.map(m => <ConnRow key={m.id} m={m} me={user} onChanged={load} onAccepted={handleAccepted} />)}</StaggerGrid>
        </>
      )}
      {past.length > 0 && (
        <>
          <h3 className="mt-5">Past</h3>
          <StaggerGrid className="mb-2">{past.map(m => <ConnRow key={m.id} m={m} me={user} onChanged={load} onAccepted={handleAccepted} />)}</StaggerGrid>
        </>
      )}

      <AnimatePresence>
        {celebrating && <ConnectionLockOn onDone={() => setCelebrating(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-[18px]">
      <span className="font-mono text-[0.72rem] uppercase tracking-wider text-signal">Your connections</span>
      <h2 className="text-2xl">Mentorships</h2>
    </div>
  );
}
