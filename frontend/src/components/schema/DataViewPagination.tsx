import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataViewPaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  itemLabel?: string
  isLoading?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function DataViewPagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  itemLabel = "rows",
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  className,
}: DataViewPaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div
      className={cn(
        "border-border/60 bg-muted/20 text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs",
        className || "border-t px-4 py-2.5"
      )}
    >
      <div className="flex items-center gap-2">
        <span>
          Showing {startItem}–{endItem} of {totalItems.toLocaleString()}{" "}
          {itemLabel}
        </span>
        {onPageSizeChange && (
          <>
            <span>·</span>
            <div className="flex items-center gap-1">
              <span>Page size:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border-input bg-background text-foreground h-6 rounded border px-1.5 text-xs shadow-xs"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {onPageChange && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-7 px-2.5 text-xs"
          >
            Previous
          </Button>
          <span className="text-foreground px-2 font-mono text-xs font-medium">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-7 px-2.5 text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
