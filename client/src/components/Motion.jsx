import { motion } from 'framer-motion';

/**
 * Motion primitives grounded in real physical/biological systems —
 * not decoration for its own sake, but because "Signal" is literally
 * about two frequencies finding each other:
 *
 *  - PHYSICS: springs use real stiffness/damping/mass, and orbits use
 *    literal circular motion (r·cosθ, r·sinθ), like the two mentor/mentee
 *    frequencies converging.
 *  - CHEMISTRY: matched skills "bond" — a line draws itself between two
 *    atoms the way a covalent bond forms when orbitals overlap.
 *  - BIOLOGY: availability/liveness uses a heartbeat rhythm (a real
 *    resting-heart lub-dub pattern), because "is this person actually here"
 *    is a liveness signal, same as a pulse.
 */

// A slightly underdamped spring: it overshoots a hair and settles,
// the way a real mass-on-a-spring does. Used for anything that should
// feel like it has weight (cards, modals, buttons).
export const SPRING = { type: 'spring', stiffness: 420, damping: 28, mass: 0.9 };
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 24, mass: 1 };
export const SPRING_SNAPPY = { type: 'spring', stiffness: 560, damping: 30, mass: 0.7 };

/** Entrance: settles in like a damped spring, staggered like cell division. */
export function StaggerGrid({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1, transition: SPRING },
      }}
    >
      {children}
    </motion.div>
  );
}

/** A card that responds like it has real mass: lifts on hover, compresses on press. */
export function PhysicsCard({ children, className = '', onClick }) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.015, transition: SPRING_SNAPPY }}
      whileTap={{ scale: 0.985, y: 0, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
    >
      {children}
    </motion.div>
  );
}

/** A button with tactile spring feedback instead of a flat CSS transition. */
export function PhysicsButton({ children, className = '', ...props }) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={SPRING_SNAPPY}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Page-level transition: a gentle spring settle, not a generic fade. */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={SPRING_SOFT}
    >
      {children}
    </motion.div>
  );
}

/**
 * BIOLOGY: a liveness pulse modeled on a resting heart rate (~65bpm,
 * with the characteristic quick lub-dub double-beat, not a generic sine pulse).
 */
export function HeartbeatDot({ color = 'var(--color-receive)', size = 8 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-wave-ping"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex rounded-full animate-heartbeat"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}

/**
 * PHYSICS + CHEMISTRY loading indicator: two particles orbit a shared
 * barycenter (like a binary star, or two bonding electrons) and cross
 * paths — visually says "searching for the overlap" without text.
 */
export function OrbitalLoader({ size = 56 }) {
  const r = size * 0.32;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.span
        className="absolute rounded-full bg-signal"
        style={{ width: size * 0.16, height: size * 0.16, top: '50%', left: '50%', marginTop: -size * 0.08, marginLeft: -size * 0.08 }}
        animate={{
          x: [r, 0, -r, 0, r],
          y: [0, r, 0, -r, 0],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
      />
      <motion.span
        className="absolute rounded-full bg-receive"
        style={{ width: size * 0.16, height: size * 0.16, top: '50%', left: '50%', marginTop: -size * 0.08, marginLeft: -size * 0.08 }}
        animate={{
          x: [-r, 0, r, 0, -r],
          y: [0, -r, 0, r, 0],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
      />
      <span className="absolute inset-0 rounded-full border border-border" />
    </div>
  );
}

/**
 * BIOLOGY: a DNA-helix loader — two backbones twisting in antiphase with
 * base-pair rungs connecting them, used for slower full-page loads
 * (registration, first sync) where "assembling your profile" fits.
 */
export function DnaLoader({ strands = 7 }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: strands }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-b from-signal to-receive"
          style={{ height: 28 }}
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.09 }}
        />
      ))}
    </div>
  );
}

/** CHEMISTRY: a bond drawing itself between two matched atoms/skills. */
export function BondLine({ x1, y1, x2, y2, color = 'var(--color-spark)', delay = 0 }) {
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={0.8}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.5 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    />
  );
}

/**
 * PHYSICS: the hero animation for the first-run landing moment. Two nodes
 * drift in from opposite sides on independent orbits, a bond draws itself
 * between them once they're close, then the whole thing gently pulses —
 * literally showing "two signals finding each other" before any form exists.
 */
export function ConstellationForming({ size = 140 }) {
  const w = size, h = size * 0.6;
  const leftX = w * 0.24, rightX = w * 0.76, midY = h / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <motion.line
        x1={leftX} y1={midY} x2={rightX} y2={midY}
        stroke="var(--color-spark)" strokeWidth={1.2}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.55 }}
        transition={{ duration: 1, delay: 1.1, ease: 'easeOut' }}
      />
      <motion.circle
        r={6} fill="var(--color-receive)"
        initial={{ cx: leftX - 30, cy: midY - 20, opacity: 0 }}
        animate={{ cx: leftX, cy: midY, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.circle
        r={6} fill="var(--color-signal)"
        initial={{ cx: rightX + 30, cy: midY - 20, opacity: 0 }}
        animate={{ cx: rightX, cy: midY, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.circle
        r={4} fill="var(--color-spark)"
        initial={{ cx: w / 2, cy: midY, scale: 0, opacity: 0 }}
        animate={{ cx: w / 2, cy: midY, scale: [0, 1.4, 1], opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.3 }}
      />
    </svg>
  );
}

/**
 * PHYSICS: two signal dots literally converge from opposite sides and lock
 * on-center in a flash — used for the single most important emotional beat
 * in the whole app: the moment a connection is accepted. Two frequencies,
 * finding each other, resolving into one.
 */
export function ConnectionLockOn({ onDone }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {}}
    >
      <div className="relative flex h-40 w-full max-w-xs items-center justify-center">
        <motion.span
          className="absolute h-4 w-4 rounded-full bg-receive shadow-[0_0_20px_var(--color-receive)]"
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.span
          className="absolute h-4 w-4 rounded-full bg-signal shadow-[0_0_20px_var(--color-signal)]"
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* the flash on impact, timed to land when both dots meet at center */}
        <motion.span
          className="absolute h-4 w-4 rounded-full bg-spark"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3.5, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.6, delay: 0.85, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute text-center"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 40, scale: 1 }}
          transition={{ delay: 1.05, ...SPRING_SOFT }}
          onAnimationComplete={() => setTimeout(onDone, 1300)}
        >
          <div className="font-display text-xl font-semibold">You're connected!</div>
          <div className="mt-1 text-sm text-text-muted">Two frequencies just found each other.</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
