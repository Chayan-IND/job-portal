const STYLES = {
  open: 'bg-success/10 text-success border-success/30',
  applied: 'bg-gold/10 text-gold-dark border-gold/30',
  shortlisted: 'bg-gold/10 text-gold-dark border-gold/30',
  hired: 'bg-success/10 text-success border-success/30',
  closed: 'bg-ink/10 text-ink-light border-ink/20',
  rejected: 'bg-danger/10 text-danger border-danger/30',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.closed;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}
