import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { EmptyState } from '../components/Shared.jsx';
import { Card, Field, Input, Select, Button } from '../components/UI.jsx';
import { StaggerGrid, StaggerItem, PhysicsCard } from '../components/Motion.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function CreateRoomForm({ onCreated }) {
  const [topic, setTopic] = useState('');
  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    await api('POST', '/rooms', { topic: topic.trim(), recurring_day: day, recurring_time: time });
    setTopic(''); setTime('');
    onCreated();
  }

  return (
    <Card className="mb-5">
      <h3>Start a room</h3>
      <form onSubmit={submit} className="flex flex-wrap gap-2.5">
        <input
          className="min-w-[160px] flex-[2] rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-text placeholder:text-text-faint"
          placeholder="Topic, e.g. Web Dev Basics" value={topic} onChange={e => setTopic(e.target.value)}
        />
        <select className="rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-text" value={day} onChange={e => setDay(e.target.value)}>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" className="rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-text" value={time} onChange={e => setTime(e.target.value)} />
        <Button type="submit">Create room</Button>
      </form>
    </Card>
  );
}

function RoomCard({ r, me, onJoined }) {
  const navigate = useNavigate();
  const toast = useToast();
  const isMember = r.members.some(m => m.id === me.id);

  async function join() {
    await api('POST', `/rooms/${r.id}/join`);
    toast('Joined room');
    onJoined();
  }

  return (
    <StaggerItem>
      <PhysicsCard className="rounded-2xl border border-border bg-surface p-[18px]">
        <h3>{r.topic}</h3>
        <div className="font-mono text-xs text-receive">{r.recurring_day ? `Weekly · ${r.recurring_day} ${r.recurring_time || ''}` : 'No fixed schedule'}</div>
        <p>Hosted by {r.mentor.name} · {r.member_count} member{r.member_count === 1 ? '' : 's'}</p>
        <div className="mt-2.5 flex gap-2">
          {isMember
            ? <Button size="sm" onClick={() => navigate(`/room/${r.id}`)}>Open room</Button>
            : <Button size="sm" variant="secondary" onClick={join}>Join</Button>}
        </div>
      </PhysicsCard>
    </StaggerItem>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState(null);

  const load = useCallback(async () => {
    const r = await api('GET', '/rooms');
    setRooms(r);
  }, []);

  useEffect(() => { load(); }, [load]);

  const canCreate = user.role === 'mentor' || user.role === 'both';

  return (
    <div>
      <div className="mb-[18px]">
        <span className="font-mono text-[0.72rem] uppercase tracking-wider text-signal">Learn together</span>
        <h2 className="text-2xl">Group mentorship rooms</h2>
      </div>
      {canCreate && <CreateRoomForm onCreated={load} />}
      {rooms && rooms.length === 0 && <EmptyState glyph="👥" title="No rooms open yet" sub="If you're a mentor, this is a great way to reach a few juniors at once." />}
      {rooms && rooms.length > 0 && (
        <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(r => <RoomCard key={r.id} r={r} me={user} onJoined={load} />)}
        </StaggerGrid>
      )}
    </div>
  );
}
