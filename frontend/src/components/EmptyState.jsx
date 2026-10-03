export default function EmptyState({ title, description, action }) {
  return (
    <div className="border border-dashed border-hairline rounded-sm py-16 px-6 text-center">
      <p className="font-serif text-xl text-ink mb-1">{title}</p>
      {description && <p className="text-sm text-ink-light mb-4">{description}</p>}
      {action}
    </div>
  );
}
