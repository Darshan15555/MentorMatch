import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Avatar, VerifiedBadge } from '../components/Shared.jsx';
import { Button, Card } from '../components/UI.jsx';
import { StaggerGrid, StaggerItem } from '../components/Motion.jsx';
import SkillGraph from '../components/SkillGraph.jsx';

export default function MentorProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [match, setMatch] = useState(null);
  const [resources, setResources] = useState([]);
  const [feedback, setFeedback] = useState([]);

  const load = useCallback(async () => {
    const [p, m, r, f] = await Promise.all([
      api('GET', `/users/${id}`),
      api('GET', `/users/${id}/match`),
      api('GET', `/resources/mentor/${id}`),
      api('GET', `/feedback/user/${id}`),
    ]);
    setProfile(p); setMatch(m); setResources(r); setFeedback(f);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function sendRequest() {
    try {
      await api('POST', '/matches', { mentor_id: id, intro_message: 'Hi! Would love to connect and learn from you.' });
      toast('Connection request sent!');
      navigate('/connections');
    } catch (err) { toast(err.message, true); }
  }

  async function askAboutStep(entry) {
    try {
      const existing = await api('GET', '/matches');
      let m = existing.find(x => x.mentor_id === id || x.mentee_id === id);
      if (!m) {
        m = await api('POST', '/matches', { mentor_id: id, intro_message: `Hi! I saw your "${entry.title}" step and wanted to ask about it.` });
        toast('Connection request sent — ask once they accept!');
        navigate('/connections');
        return;
      }
      if (m.status !== 'accepted') { toast('Waiting on connection to be accepted first.'); navigate('/connections'); return; }
      sessionStorage.setItem(`mp_prefill_${m.id}`, `About your "${entry.title}" step: `);
      navigate(`/chat/${m.id}`);
    } catch (err) { toast(err.message, true); }
  }

  async function saveResource(resourceId) {
    await api('POST', `/resources/${resourceId}/save`);
    toast('Saved to your library');
  }

  if (!profile || !match) return null;
  const isMe = profile.id === user.id;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar name={profile.name} size={72} />
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-2xl">{profile.name}{profile.isVerified && <VerifiedBadge size={18} />}</h2>
          <p>{profile.bio || 'No bio yet.'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3.5 text-sm">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${profile.availabilityStatus === 'open' ? 'border-receive/40 text-receive' : 'border-border text-text-faint'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{profile.availabilityStatus === 'open' ? 'Open to mentees' : 'Busy'}
            </span>
            {profile.sessionCount > 0 && (
              <span className="rounded-full border border-spark/35 px-2.5 py-1 font-mono text-[0.7rem] text-spark">{profile.mentorLevel} · {profile.avgRating}★ ({profile.sessionCount})</span>
            )}
            {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a>}
            {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}
          </div>
        </div>
        {!isMe && <Button onClick={sendRequest}>Connect</Button>}
      </div>

      <Card>
        <h3>Skill graph</h3>
        <p>{match.explanation}</p>
        <SkillGraph graph={match.skillGraph} />
      </Card>

      {profile.timeline?.length > 0 && (
        <Card className="mt-5">
          <h3>Career path</h3>
          <div className="ml-2 border-l-2 border-border pl-5">
            {profile.timeline.map(t => (
              <div key={t.id} className="relative mb-[22px] before:absolute before:-left-[25px] before:top-1 before:h-2.5 before:w-2.5 before:rounded-full before:bg-signal before:shadow-[0_0_8px_var(--color-signal)]">
                <div className="font-mono text-xs text-signal">{t.year}</div>
                <div className="mt-0.5 font-semibold">{t.title}</div>
                <p>{t.description}</p>
                {!isMe && <Button size="sm" variant="ghost" className="mt-1.5" onClick={() => askAboutStep(t)}>Ask about this step →</Button>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {resources.length > 0 && (
        <Card className="mt-5">
          <h3>Resources shared</h3>
          {resources.map(r => (
            <div key={r.id} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3.5 py-3">
              <div>
                <a className="font-semibold" href={r.link} target="_blank" rel="noreferrer">{r.title}</a>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {r.tags.map(t => <span key={t.id} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">{t.name}</span>)}
                </div>
              </div>
              {!isMe && <Button size="sm" variant="secondary" onClick={() => saveResource(r.id)}>Save</Button>}
            </div>
          ))}
        </Card>
      )}

      {feedback.filter(f => f.endorsement).length > 0 && (
        <Card className="mt-5">
          <h3>What mentees say</h3>
          <StaggerGrid>
            {feedback.filter(f => f.endorsement).slice(0, 5).map(f => (
              <StaggerItem key={f.id}>
                <div className="mb-2.5 border-b border-border pb-2.5">
                  <div>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
                  <p>"{f.comment}" — {f.from_name}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </Card>
      )}
    </div>
  );
}
