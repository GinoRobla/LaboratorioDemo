import { IconChevronLeft, IconChevronRight } from "./icons.jsx";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="icon-only secondary"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <IconChevronLeft />
      </button>
      <span className="pagination-label">
        Página {page} de {totalPages}
      </span>
      <button
        className="icon-only secondary"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        <IconChevronRight />
      </button>
    </div>
  );
}
