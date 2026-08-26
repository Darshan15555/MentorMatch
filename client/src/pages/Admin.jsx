import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { EmptyState } from '../components/Shared.jsx';
import { Card, Button, StatusPill } from '../components/UI.jsx';
import { StaggerGrid, StaggerItem } from '../components/Motion.jsx';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [unverified, setUnverified] = useState(null);
  const [denied, setDenied] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const [s, r, u] = await Promise.all([
        api('GET', '/admin/stats'),
        api('GET', '/admin/reports'),
        api('GET', '/admin/users/unverified'),
      ]);
      setStats(s); setReports(r); setUnverified(u);
    } catch { setDenied(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markReviewed(id) { await api('PATCH', `/admin/reports/${id}`, { status: 'reviewed' }); toast('Marked reviewed'); load(); }
  async function banUser(userId) { await api('PATCH', `/admin/users/${userId}/ban`, { banned: true }); toast('User banned'); load(); }
  async function verifyUser(userId) { await api('PATCH', `/admin/users/${userId}/verify`, {}); toast('User verified'); load(); }

  if (denied) return <EmptyState glyph="🔒" title="Admin access required" sub="Your account does not have admin privileges." />;
  if (!stats) return null;

  const cards = [
    ['Users', stats.userCount], ['Mentors', stats.mentorCount], ['Mentees', stats.menteeCount],
    ['Connections', stats.matchCount], ['Accepted', stats.acceptedMatches], ['Messages sent', stats.messageCount],
    ['Rooms', stats.roomCount], ['Open reports', stats.openReports],
  ];

  return (
    <div>
      <div className="mb-[18px]">
        <span className="font-mono text-[0.72rem] uppercase tracking-wider text-signal">Admin</span>
        <h2 className="text-2xl">Platform overview</h2>
      </div>
      <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <StaggerItem key={label}>
            <Card>
              <div className="font-display text-3xl font-bold text-signal">{value}</div>
              <div className="text-sm text-text-muted">{label}</div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerGrid>

      <Card className="mt-6">
        <h3>Pending verification</h3>
        {unverified && unverified.length === 0 && <p>Everyone is verified.</p>}
        {unverified && unverified.map(u => (
          <div key={u.id} className="flex flex-col gap-2 border-b border-border py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm">{u.name}</div>
              <div className="text-xs text-text-muted">{u.email}</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => verifyUser(u.id)}>Verify</Button>
          </div>
        ))}
      </Card>

      <Card className="mt-6">
        <h3>Moderation reports</h3>
        {reports.length === 0 && <p>No reports filed.</p>}
        {reports.map(r => (
          <div key={r.id} className="flex flex-col gap-2 border-b border-border py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm">{r.reporter_name} reported {r.reported_name}</div>
              <div className="text-xs text-text-muted">{r.reason}</div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill status={r.status === 'open' ? 'pending' : 'archived'} />
              {r.status === 'open' && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => markReviewed(r.id)}>Mark reviewed</Button>
                  <Button size="sm" variant="danger" onClick={() => banUser(r.reported_user_id)}>Ban user</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
