import { useMemo } from 'react';
import { motion } from 'framer-motion';

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}

function layoutNodes(list, cx, cy, spreadX, spreadY) {
  return list.map((name, i) => {
    const angle = (i / Math.max(list.length, 1)) * Math.PI * 2;
    return {
      name,
      baseX: cx + Math.cos(angle) * spreadX * 0.4,
      baseY: cy + Math.sin(angle) * spreadY * 0.32,
      // Physics: each node gets a slightly different orbital radius/phase,
      // like electrons in different sub-shells — no two move identically.
      orbitR: 2 + (i % 3) * 1.3,
      orbitPeriod: 3.5 + (i % 4) * 0.9,
      phase: i * 0.7,
    };
  });
}

/**
 * The skill graph is the platform's signature: a small constellation
 * where two people's skills either sit apart or bond in the middle.
 *
 * PHYSICS: nodes gently orbit their base position (real circular motion,
 * x = r·cos(ωt+φ), y = r·sin(ωt+φ)) instead of sitting static — like
 * atoms vibrating even at rest.
 * CHEMISTRY: "shared" nodes are drawn as bonds forming between the two
 * people's orbitals, with a stroke that draws itself in (bond formation),
 * colored by bond type (teachable = a stronger, brighter bond).
 */
export default function SkillGraph({ graph, compact = false }) {
  const w = compact ? 280 : 480;
  const h = compact ? 120 : 200;
  const leftCx = w * 0.28, rightCx = w * 0.72, midCy = h / 2;

  const { menteeNodes, mentorNodes, sharedNodes } = useMemo(() => ({
    menteeNodes: layoutNodes(graph.menteeOnly.slice(0, compact ? 4 : 8), leftCx, midCy, 60, h).map(n => ({ ...n, cls: 'mentee' })),
    mentorNodes: layoutNodes(graph.mentorOnly.slice(0, compact ? 4 : 8), rightCx, midCy, 60, h).map(n => ({ ...n, cls: 'mentor' })),
    sharedNodes: layoutNodes(graph.shared.slice(0, compact ? 5 : 10), w / 2, midCy, 40, h).map(n => ({ ...n, cls: 'shared' })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [graph, compact]);

  const nodes = [...menteeNodes, ...mentorNodes, ...sharedNodes];
  const colorFor = { mentee: 'var(--color-receive)', mentor: 'var(--color-signal)', shared: 'var(--color-spark)' };
  const radiusFor = { mentee: compact ? 2.4 : 3.4, mentor: compact ? 2.4 : 3.4, shared: compact ? 3 : 4.2 };
  const fontSize = compact ? 8 : 10.5;

  return (
    <div className="my-3.5 rounded-lg bg-bg-elevated p-3.5">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={compact ? 100 : 180}>
        {/* Chemistry: bonds drawing themselves in from each side to the shared node */}
        {sharedNodes.map((sn, i) => {
          const isTeachable = graph.teachable.includes(sn.name.toLowerCase()) || graph.teachable.includes(sn.name);
          return (
            <g key={`bond-${i}`}>
              <motion.line
                x1={leftCx} y1={midCy} x2={sn.baseX} y2={sn.baseY}
                stroke="var(--color-signal-dim)" strokeWidth={isTeachable ? 1.1 : 0.6}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
              />
              <motion.line
                x1={rightCx} y1={midCy} x2={sn.baseX} y2={sn.baseY}
                stroke="var(--color-receive)" strokeWidth={isTeachable ? 1.1 : 0.6}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.08 + 0.05, ease: 'easeOut' }}
              />
            </g>
          );
        })}

        {/* Physics: every node gently orbits its resting position, never fully still */}
        {nodes.map((n, i) => (
          <motion.g
            key={`node-${i}`}
            initial={{ x: n.baseX, y: n.baseY, opacity: 0 }}
            animate={{
              x: [n.baseX, n.baseX + Math.cos(n.phase) * n.orbitR, n.baseX],
              y: [n.baseY, n.baseY + Math.sin(n.phase) * n.orbitR, n.baseY],
              opacity: 1,
            }}
            transition={{
              x: { duration: n.orbitPeriod, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: n.orbitPeriod, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: 0.4, delay: i * 0.03 },
            }}
          >
            <circle r={radiusFor[n.cls]} fill={colorFor[n.cls]} />
            {!compact && (
              <text y={-8} fontSize={fontSize} fill="var(--color-text-muted)" textAnchor="middle" fontFamily="var(--font-mono)">
                {escapeXml(n.name)}
              </text>
            )}
          </motion.g>
        ))}
      </svg>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-3.5 text-[0.72rem] text-text-muted">
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: 'var(--color-receive)' }} />Your skills</span>
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: 'var(--color-spark)' }} />Shared</span>
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: 'var(--color-signal)' }} />Their skills</span>
        </div>
      )}
    </div>
  );
}
