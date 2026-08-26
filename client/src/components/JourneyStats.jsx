import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client.js';
import { SPRING_SOFT } from './Motion.jsx';

function StatBlock({ value, label, delay }) {
  return (
    <motion.div
      className="flex-1 min-w-[110px] rounded-xl border border-border bg-bg-elevated px-4 py-3"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING_SOFT, delay }}
    >
      <div className="font-display text-2xl font-bold text-signal">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </motion.div>
  );
}

/**
 * Reflects a mentee's progress back to them — the data (goals, sessions)
 * already existed, it just wasn't visible anywhere. Seeing "3 milestones hit"
 * turns a chat log into a sense of forward motion.
 */
export default function JourneyStats() {
  const [journey, setJourney] = useState(null);

  useEffect(() => {
    api('GET', '/users/me/journey').then(setJourney).catch(() => {});
  }, []);

  if (!journey || journey.connectionsCount === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 font-mono text-[0.7rem] uppercase tracking-wider text-signal">Your journey so far</div>
      <div className="flex flex-wrap gap-3">
        <StatBlock value={journey.connectionsCount} label="Active connections" delay={0} />
        <StatBlock value={journey.milestonesCompleted} label="Milestones hit" delay={0.06} />
        <StatBlock value={journey.goalsInProgress} label="Goals in motion" delay={0.12} />
      </div>
    </div>
  );
}
