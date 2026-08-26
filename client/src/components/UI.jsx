import { PhysicsButton } from './Motion.jsx';

const VARIANTS = {
  primary: 'bg-signal text-white hover:bg-[#7d9aff]',
  secondary: 'bg-surface-hover text-text border border-border hover:bg-border',
  ghost: 'bg-transparent text-text-muted hover:text-text',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25',
};
const SIZES = { md: 'px-5 py-2.5 text-[0.92rem]', sm: 'px-3 py-1.5 text-xs' };

export function Button({ variant = 'primary', size = 'md', block = false, className = '', children, ...props }) {
  return (
    <PhysicsButton
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </PhysicsButton>
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl border border-border bg-surface p-7 ${className}`}>{children}</div>;
}

const fieldBase = 'w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[0.95rem] text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-signal/50';

export function Field({ label, children }) {
  return (
    <div className="mb-4">
      {label && <label className="mb-1.5 block text-[0.82rem] text-text-muted">{label}</label>}
      {children}
    </div>
  );
}

export function Input(props) {
  return <input className={fieldBase} {...props} />;
}

export function TextArea(props) {
  return <textarea className={`${fieldBase} min-h-[70px] resize-y`} {...props} />;
}

export function Select({ children, ...props }) {
  return <select className={fieldBase} {...props}>{children}</select>;
}

export function Chip({ tone = 'plain', onRemove, children }) {
  const toneClass = {
    have: 'text-signal border-signal/40 bg-signal/10',
    want: 'text-receive border-receive/40 bg-receive/10',
    plain: 'text-text-muted border-border',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 pl-3 font-mono text-xs ${toneClass}`}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="opacity-60 hover:opacity-100">✕</button>
      )}
    </span>
  );
}

export function StatusPill({ status }) {
  const toneClass = {
    pending: 'text-spark border-spark/40',
    accepted: 'text-receive border-receive/40',
    declined: 'text-text-faint border-border',
    archived: 'text-text-faint border-border',
  }[status] || 'text-text-faint border-border';
  return <span className={`rounded-full border px-2.5 py-1 font-mono text-[0.7rem] ${toneClass}`}>{status}</span>;
}
