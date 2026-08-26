export function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function Avatar({ name, size = 44 }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-signal to-receive font-display font-bold text-bg"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

export function EmptyState({ glyph, title, sub }) {
  return (
    <div className="py-16 px-5 text-center text-text-muted">
      <div className="mb-2.5 text-3xl">{glyph}</div>
      <h3 className="text-text">{title}</h3>
      <p>{sub || ''}</p>
    </div>
  );
}

export function ConstellationLogo() {
  return (
    <svg width="90" height="50" viewBox="0 0 90 50">
      <line x1="20" y1="25" x2="45" y2="15" stroke="var(--color-signal-dim)" strokeWidth="1" opacity="0.6" />
      <line x1="45" y1="15" x2="70" y2="25" stroke="var(--color-receive)" strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="25" x2="45" y2="35" stroke="var(--color-signal-dim)" strokeWidth="1" opacity="0.6" />
      <line x1="45" y1="35" x2="70" y2="25" stroke="var(--color-receive)" strokeWidth="1" opacity="0.6" />
      <circle cx="20" cy="25" r="4" fill="var(--color-receive)" />
      <circle cx="70" cy="25" r="4" fill="var(--color-signal)" />
      <circle cx="45" cy="15" r="3.2" fill="var(--color-spark)" />
      <circle cx="45" cy="35" r="3.2" fill="var(--color-spark)" />
    </svg>
  );
}

/** A small trust signal: shown next to a name wherever isVerified is true. */
export function VerifiedBadge({ size = 14 }) {
  return (
    <span
      title="Verified college email"
      className="inline-flex items-center justify-center rounded-full bg-receive/15 text-receive"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none">
        <path d="M9 12.5l2 2 4-4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
