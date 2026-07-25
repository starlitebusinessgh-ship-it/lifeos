"use client";

import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { READING_STATES, readingStateLabel } from "@/lib/learn/readingState";
import {
  SHELF_SORT_OPTIONS,
  type ShelfFilters,
  type ShelfSortKey,
  type ShelfViewMode,
} from "@/lib/learn/shelfQuery";
import { haptic } from "@/lib/finance/haptics";

export function ShelfToolbar({
  resultCount,
  totalCount,
  view,
  sort,
  filters,
  availableTags,
  availableSeries,
  filtersOpen,
  onViewChange,
  onSortChange,
  onFiltersChange,
  onFiltersOpenChange,
}: {
  resultCount: number;
  totalCount: number;
  view: ShelfViewMode;
  sort: ShelfSortKey;
  filters: ShelfFilters;
  availableTags: string[];
  availableSeries: string[];
  filtersOpen: boolean;
  onViewChange: (view: ShelfViewMode) => void;
  onSortChange: (sort: ShelfSortKey) => void;
  onFiltersChange: (filters: ShelfFilters) => void;
  onFiltersOpenChange: (open: boolean) => void;
}) {
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.tag !== "all" ||
    filters.series !== "all" ||
    filters.query.trim().length > 0;

  return (
    <div className="ln-shelf-toolbar">
      <div className="ln-shelf-toolbar-row">
        <div className="ln-shelf-search-wrap">
          <Search size={16} className="ln-shelf-search-icon" />
          <input
            type="search"
            className="ln-shelf-search"
            placeholder="Search this shelf…"
            value={filters.query}
            onChange={(e) =>
              onFiltersChange({ ...filters, query: e.target.value })
            }
          />
          {filters.query && (
            <button
              type="button"
              className="ln-shelf-search-clear"
              aria-label="Clear search"
              onClick={() => onFiltersChange({ ...filters, query: "" })}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="ln-shelf-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            aria-label="Grid view"
            onClick={() => {
              haptic("light");
              onViewChange("grid");
            }}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            aria-label="List view"
            onClick={() => {
              haptic("light");
              onViewChange("list");
            }}
          >
            <List size={17} />
          </button>
        </div>
      </div>

      <div className="ln-shelf-toolbar-row ln-shelf-toolbar-row--meta">
        <button
          type="button"
          className={`ln-shelf-filter-btn ${filtersOpen || hasActiveFilters ? "active" : ""}`}
          onClick={() => {
            haptic("light");
            onFiltersOpenChange(!filtersOpen);
          }}
        >
          <SlidersHorizontal size={15} />
          Filter & sort
          {hasActiveFilters && <span className="ln-shelf-filter-dot" />}
        </button>
        <span className="ln-shelf-result-count">
          {resultCount === totalCount
            ? `${totalCount} books`
            : `${resultCount} of ${totalCount}`}
        </span>
      </div>

      {filtersOpen && (
        <div className="ln-shelf-filters">
          <div className="ln-shelf-filter-group">
            <span className="ln-shelf-filter-label">Sort by</span>
            <div className="ln-shelf-chip-row">
              {SHELF_SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`ln-shelf-chip ${sort === opt.key ? "active" : ""}`}
                  onClick={() => {
                    haptic("light");
                    onSortChange(opt.key);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ln-shelf-filter-group">
            <span className="ln-shelf-filter-label">Status</span>
            <div className="ln-shelf-chip-row">
              <button
                type="button"
                className={`ln-shelf-chip ${filters.status === "all" ? "active" : ""}`}
                onClick={() => onFiltersChange({ ...filters, status: "all" })}
              >
                All
              </button>
              {READING_STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`ln-shelf-chip ${filters.status === s ? "active" : ""}`}
                  onClick={() => onFiltersChange({ ...filters, status: s })}
                >
                  {readingStateLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="ln-shelf-filter-group">
              <span className="ln-shelf-filter-label">Tag</span>
              <div className="ln-shelf-chip-row">
                <button
                  type="button"
                  className={`ln-shelf-chip ${filters.tag === "all" ? "active" : ""}`}
                  onClick={() => onFiltersChange({ ...filters, tag: "all" })}
                >
                  All
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`ln-shelf-chip ${filters.tag === tag ? "active" : ""}`}
                    onClick={() => onFiltersChange({ ...filters, tag })}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableSeries.length > 0 && (
            <div className="ln-shelf-filter-group">
              <span className="ln-shelf-filter-label">Series</span>
              <div className="ln-shelf-chip-row">
                <button
                  type="button"
                  className={`ln-shelf-chip ${filters.series === "all" ? "active" : ""}`}
                  onClick={() => onFiltersChange({ ...filters, series: "all" })}
                >
                  All
                </button>
                {availableSeries.map((series) => (
                  <button
                    key={series}
                    type="button"
                    className={`ln-shelf-chip ${filters.series === series ? "active" : ""}`}
                    onClick={() => onFiltersChange({ ...filters, series })}
                  >
                    {series}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
