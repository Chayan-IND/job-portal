export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-hairline pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        className="text-sm font-medium text-ink disabled:text-ink/30 hover:text-gold-dark transition-colors"
      >
        ← Previous
      </button>
      <span className="text-sm text-ink-light">Page {page} of {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className="text-sm font-medium text-ink disabled:text-ink/30 hover:text-gold-dark transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
