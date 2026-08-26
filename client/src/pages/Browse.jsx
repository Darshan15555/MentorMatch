import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { EmptyState, Avatar, VerifiedBadge } from '../components/Shared.jsx';
import SkillGraph from '../components/SkillGraph.jsx';
import { StaggerGrid, StaggerItem, PhysicsCard, OrbitalLoader } from '../components/Motion.jsx';
import JourneyStats from '../components/JourneyStats.jsx';

function MatchCard({ result, onOpen }) {
  const { mentor, matchScore, explanation, skillGraph } = result;
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (matchScore / 100) * circumference;

  return (
    <StaggerItem>
      <PhysicsCard
        onClick={onOpen}
        className="cursor-pointer rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-signal-dim"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <Avatar name={mentor.name} />
            <div>
              <div className="flex items-center gap-1.5 text-base font-semibold">
                {mentor.name}
                {mentor.isVerified && <VerifiedBadge />}
              </div>
              <div className="text-xs text-text-muted">{mentor.yearBranch || (mentor.availabilityStatus === 'open' ? 'Open to mentees' : 'Busy')}</div>
            </div>
          </div>
          <div className="relative h-[46px] w-[46px] flex-shrink-0">
            <svg width="46" height="46" className="-rotate-90">
              <circle cx="23" cy="23" r="20" className="fill-none stroke-border" strokeWidth="4" />
              <circle
                cx="23" cy="23" r="20" className="fill-none stroke-signal transition-[stroke-dashoffset] duration-700"
                strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[0.7rem]">{matchScore}%</div>
          </div>
        </div>

        <SkillGraph graph={skillGraph} compact />

        <div className="my-3 min-h-10 text-sm text-text-muted">{explanation}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${mentor.availabilityStatus === 'open' ? 'border-receive/40 text-receive' : 'border-border text-text-faint'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />{mentor.availabilityStatus === 'open' ? 'Open' : 'Busy'}
          </span>
          {mentor.sessionCount > 0 && (
            <span className="rounded-full border border-spark/35 px-2.5 py-1 font-mono text-[0.7rem] text-spark">{mentor.mentorLevel}</span>
          )}
        </div>
      </PhysicsCard>
    </StaggerItem>
  );
}

export default function BrowsePage() {
  const [results, setResults] = useState(null);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [availability, setAvailability] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (skill) qs.set('skill', skill);
    if (availability) qs.set('availability', availability);
    const data = await api('GET', `/users/browse/mentors?${qs.toString()}`);
    setResults(data);
  }, [q, skill, availability]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-[18px] flex items-baseline justify-between">
        <div>
          <span className="font-mono text-[0.72rem] uppercase tracking-wider text-signal">Find your frequency</span>
          <h2 className="text-2xl">Browse mentors</h2>
        </div>
      </div>

      <JourneyStats />

      <div className="mb-6 flex flex-wrap gap-2.5">
        <input
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-text placeholder:text-text-faint"
          placeholder="Search by name or bio..." value={q} onChange={e => setQ(e.target.value)}
        />
        <input
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-text placeholder:text-text-faint"
          placeholder="Filter by skill (e.g. React)" value={skill} onChange={e => setSkill(e.target.value)}
        />
        <select
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-text"
          value={availability} onChange={e => setAvailability(e.target.value)}
        >
          <option value="">Any availability</option>
          <option value="open">Open to mentees</option>
          <option value="busy">Busy</option>
        </select>
      </div>

      {results === null && (
        <div className="flex items-center gap-4 py-10">
          <OrbitalLoader size={48} />
          <p>Scanning for compatible frequencies...</p>
        </div>
      )}
      {results && results.length === 0 && (
        <EmptyState glyph="📡" title="It's quiet out here" sub="No mentors match yet — try loosening a filter, or check back soon as more seniors join." />
      )}
      {results && results.length > 0 && (
        <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(r => <MatchCard key={r.mentor.id} result={r} onOpen={() => navigate(`/mentor/${r.mentor.id}`)} />)}
        </StaggerGrid>
      )}
    </div>
  );
}
