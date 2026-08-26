import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, Field, Input, Select, Button, Chip } from '../components/UI.jsx';
import { SPRING } from '../components/Motion.jsx';

function AnimatedChip({ children, ...props }) {
  return (
    <motion.div layout initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={SPRING}>
      <Chip {...props}>{children}</Chip>
    </motion.div>
  );
}

export default function OnboardingPage() {
  const { setUser } = useAuth();
  const [me, setMe] = useState(null);

  const load = useCallback(async () => {
    const fresh = await api('GET', '/users/me');
    setMe(fresh);
    setUser(fresh);
  }, [setUser]);

  useEffect(() => { load(); }, [load]);
  if (!me) return null;

  return (
    <div>
      <div className="mb-[18px]">
        <span className="font-mono text-[0.72rem] uppercase tracking-wider text-signal">Your profile</span>
        <h2 className="text-2xl">{me.name}</h2>
      </div>

      <BasicsCard me={me} onSaved={load} />
      <div className="h-5" />
      <SkillsCard me={me} onChanged={load} />
      <div className="h-5" />
      <InterestsCard me={me} onChanged={load} />

      {(me.role === 'mentor' || me.role === 'both') && (
        <>
          <div className="h-5" />
          <TimelineCard me={me} onChanged={load} />
          <div className="h-5" />
          <ResourceCard me={me} />
        </>
      )}
    </div>
  );
}

function BasicsCard({ me, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    bio: me.bio || '', year_branch: me.yearBranch || '',
    github_url: me.githubUrl || '', linkedin_url: me.linkedinUrl || '', role: me.role,
  });
  function update(field) { return (e) => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    await api('PATCH', '/users/me', form);
    toast('Profile updated');
    onSaved();
  }

  return (
    <Card>
      <h3>Basics</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bio"><Input value={form.bio} onChange={update('bio')} placeholder="A short intro about you..." /></Field>
          <Field label="Year / Branch"><Input value={form.year_branch} onChange={update('year_branch')} placeholder="e.g. 3rd Year, CSE" /></Field>
          <Field label="GitHub URL"><Input value={form.github_url} onChange={update('github_url')} placeholder="https://github.com/you" /></Field>
          <Field label="LinkedIn URL"><Input value={form.linkedin_url} onChange={update('linkedin_url')} placeholder="https://linkedin.com/in/you" /></Field>
        </div>
        <Field label="Your role">
          <Select value={form.role} onChange={update('role')}>
            <option value="mentee">Junior / Mentee</option>
            <option value="mentor">Senior / Mentor</option>
            <option value="both">Both</option>
          </Select>
        </Field>
        <Button type="submit">Save basics</Button>
      </form>
    </Card>
  );
}

function SkillsCard({ me, onChanged }) {
  const [haveInput, setHaveInput] = useState('');
  const [wantInput, setWantInput] = useState('');

  async function addSkill(type, value, reset) {
    if (!value.trim()) return;
    await api('POST', '/users/me/skills', { skill_name: value.trim(), type });
    reset('');
    onChanged();
  }
  async function removeSkill(skillId, type) {
    await api('DELETE', `/users/me/skills/${skillId}/${type}`);
    onChanged();
  }

  const detailed = me.skillsDetailed || [];
  const haveChips = detailed.filter(s => s.type === 'have');
  const wantChips = detailed.filter(s => s.type === 'want');

  return (
    <Card>
      <h3>Skills — two-way tagging</h3>
      <p>Tag what you already know, and separately, what you want to learn. Matching uses both.</p>

      <label className="mb-1.5 mt-3.5 block text-sm">I currently know:</label>
      <form className="mb-2.5 flex gap-2" onSubmit={(e) => { e.preventDefault(); addSkill('have', haveInput, setHaveInput); }}>
        <Input value={haveInput} onChange={e => setHaveInput(e.target.value)} placeholder="Add a skill you HAVE, e.g. React" />
        <Button size="sm" variant="secondary" type="submit">Add</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {haveChips.map(s => <AnimatedChip key={s.id} tone="have" onRemove={() => removeSkill(s.id, 'have')}>{s.name}</AnimatedChip>)}
        </AnimatePresence>
      </div>

      <label className="mb-1.5 mt-4 block text-sm">I want to learn:</label>
      <form className="mb-2.5 flex gap-2" onSubmit={(e) => { e.preventDefault(); addSkill('want', wantInput, setWantInput); }}>
        <Input value={wantInput} onChange={e => setWantInput(e.target.value)} placeholder="Add a skill you WANT to learn, e.g. DSA" />
        <Button size="sm" variant="secondary" type="submit">Add</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {wantChips.map(s => <AnimatedChip key={s.id} tone="want" onRemove={() => removeSkill(s.id, 'want')}>{s.name}</AnimatedChip>)}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function InterestsCard({ me, onChanged }) {
  const [input, setInput] = useState('');
  async function addInterest(e) {
    e.preventDefault();
    if (!input.trim()) return;
    await api('POST', '/users/me/interests', { name: input.trim() });
    setInput('');
    onChanged();
  }
  async function removeInterest(name) {
    await api('DELETE', `/users/me/interests/${encodeURIComponent(name)}`);
    onChanged();
  }

  return (
    <Card>
      <h3>General interests</h3>
      <form className="mb-2.5 flex gap-2" onSubmit={addInterest}>
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. Open source, hackathons" />
        <Button size="sm" variant="secondary" type="submit">Add</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {(me.interests || []).map(name => <AnimatedChip key={name} onRemove={() => removeInterest(name)}>{name}</AnimatedChip>)}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function TimelineCard({ me, onChanged }) {
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function addEntry(e) {
    e.preventDefault();
    if (!year || !title) return;
    await api('POST', '/users/me/timeline', { year, title, description });
    setYear(''); setTitle(''); setDescription('');
    onChanged();
  }
  async function removeEntry(id) { await api('DELETE', `/users/me/timeline/${id}`); onChanged(); }

  return (
    <Card>
      <h3>Career path timeline</h3>
      <p>Show juniors the steps that got you here — they can tap any step to ask about it.</p>
      {(me.timeline || []).map(t => (
        <div key={t.id} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3.5 py-3">
          <div>
            <div className="font-semibold">{t.year} — {t.title}</div>
            <div className="text-sm text-text-muted">{t.description}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => removeEntry(t.id)}>Remove</Button>
        </div>
      ))}
      <form onSubmit={addEntry} className="mt-3 flex flex-wrap gap-2">
        <input className="w-[120px] rounded-lg border border-border bg-bg-elevated px-2.5 py-2 text-text" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} />
        <input className="min-w-[160px] flex-1 rounded-lg border border-border bg-bg-elevated px-2.5 py-2 text-text" placeholder="Milestone title" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="min-w-[200px] flex-[2] rounded-lg border border-border bg-bg-elevated px-2.5 py-2 text-text" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
        <Button variant="secondary" type="submit">Add step</Button>
      </form>
    </Card>
  );
}

function ResourceCard({ me }) {
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [tags, setTags] = useState('');

  const load = useCallback(async () => setResources(await api('GET', `/resources/mentor/${me.id}`)), [me.id]);
  useEffect(() => { load(); }, [load]);

  async function addResource(e) {
    e.preventDefault();
    if (!title || !link) return;
    const skill_names = tags.split(',').map(s => s.trim()).filter(Boolean);
    await api('POST', '/resources', { title, link, skill_names });
    setTitle(''); setLink(''); setTags('');
    load();
  }
  async function removeResource(id) { await api('DELETE', `/resources/${id}`); load(); }

  return (
    <Card>
      <h3>Resource drop</h3>
      <p>Share links tagged by skill — mentees can save them to their personal library.</p>
      {resources.map(r => (
        <div key={r.id} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3.5 py-3">
          <div>
            <div className="font-semibold">{r.title}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {r.tags.map(t => <span key={t.id} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">{t.name}</span>)}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => removeResource(r.id)}>Remove</Button>
        </div>
      ))}
      <form onSubmit={addResource} className="mt-3 flex flex-wrap gap-2">
        <input className="min-w-[140px] flex-1 rounded-lg border border-border bg-bg-elevated px-2.5 py-2 text-text" placeholder="Resource title" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="min-w-[160px] flex-1 rounded-lg border border-border bg-bg-elevated px-2.5 py-2 text-text" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
        <input className="min-w-[140px] flex-1 rounded-lg border border-border bg-bg-elevated px-2.5 py-2 text-text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />
        <Button variant="secondary" type="submit">Add resource</Button>
      </form>
    </Card>
  );
}
