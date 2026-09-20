import { type ReactNode } from "react"
import { ArrowRight, Plus, Search, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CARD } from "./dashboardPreviewData"

// ── StatusDot ─────────────────────────────────────────────────────────────

export function StatusDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-success h-1.5 w-1.5 animate-pulse rounded-full",
        className
      )}
    />
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────

export function EmptyState({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn("text-muted-foreground p-6 text-center text-xs", className)}
    >
      {children}
    </p>
  )
}

// ── SearchInput ───────────────────────────────────────────────────────────

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
      <Input
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background/80 border-border/80 h-8 pl-8 text-xs"
      />
    </div>
  )
}

// ── SegmentedControl ──────────────────────────────────────────────────────

export interface SegmentOption<V extends string> {
  value: V
  label: string
  /** Text colour when active. Defaults to text-foreground. */
  activeClassName?: string
}

interface SegmentedControlProps<V extends string> {
  options: readonly SegmentOption<V>[]
  value: V
  onChange: (value: V) => void
  className?: string
}

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<V>) {
  return (
    <div
      className={cn(
        "border-border/80 bg-muted/30 inline-flex items-center gap-0.5 rounded-lg border p-0.5",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <Button
            key={o.value}
            variant="ghost"
            size="xs"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-6 px-2 text-xs font-medium",
              active
                ? cn(
                    "bg-background font-medium shadow-xs",
                    o.activeClassName ?? "text-foreground"
                  )
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </Button>
        )
      })}
    </div>
  )
}

// ── PageHeader + HeaderButton ─────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  desc: string
  badge?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, desc, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-foreground text-lg font-medium">{title}</h3>
          {badge}
        </div>
        <p className="text-muted-foreground text-xs">{desc}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface HeaderButtonProps {
  label: string
  icon?: LucideIcon
  variant?: "default" | "outline"
}

export function HeaderButton({
  label,
  icon: Icon = Plus,
  variant = "default",
}: HeaderButtonProps) {
  return (
    <Button
      variant={variant}
      size="xs"
      className="h-8 gap-1.5 font-medium shadow-xs"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Button>
  )
}

// ── PillBadge ─────────────────────────────────────────────────────────────

const TONES = {
  muted: "bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary border",
} as const

interface PillBadgeProps {
  tone?: keyof typeof TONES
  className?: string
  children: ReactNode
}

export function PillBadge({
  tone = "muted",
  className,
  children,
}: PillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

// ── DataTable ─────────────────────────────────────────────────────────────

export interface Column<T> {
  header: string
  align?: "left" | "right"
  /** Extra classes for the <td>. */
  className?: string
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: readonly Column<T>[]
  rows: readonly T[]
  getRowKey: (row: T) => string
  emptyText?: string
  /** Optional bar above the header row. */
  toolbar?: ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyText = "No matching results found.",
  toolbar,
}: DataTableProps<T>) {
  return (
    <div className={cn(CARD, "overflow-hidden")}>
      {toolbar && (
        <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-4 py-2">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-border/60 bg-muted/30 text-muted-foreground border-b text-[11px] font-medium uppercase">
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border/50 divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState>{emptyText}</EmptyState>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="hover:bg-muted/35 group transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={cn(
                        "px-4 py-3",
                        col.align === "right" && "text-right",
                        col.className
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────

export function ProgressBar({
  percentage,
  running,
}: {
  percentage: number
  running?: boolean
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-xs"
    >
      <div
        className={cn(
          "h-full",
          running ? "bg-info animate-pulse" : "bg-success"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// ── MetricTile ────────────────────────────────────────────────────────────

interface MetricTileProps {
  label: string
  value: string
  sub: string
}

export function MetricTile({ label, value, sub }: MetricTileProps) {
  return (
    <div className={cn(CARD, "p-3")}>
      <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
      <p className="text-foreground mt-0.5 font-mono text-xl font-medium">
        {value}
      </p>
      <p className="text-muted-foreground text-[10px]">{sub}</p>
    </div>
  )
}

// ── OpenStudioButton ──────────────────────────────────────────────────────

export function OpenStudioButton({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="xs"
      className={cn(
        "text-muted-foreground hover:text-foreground group/btn h-7 gap-1 text-xs",
        className
      )}
    >
      <span>Open Studio</span>
      <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
    </Button>
  )
}

// ── EntityCell (icon + title + subtitle) ──────────────────────────────────

interface EntityCellProps {
  icon: ReactNode
  iconClassName?: string
  title: string
  subtitle: ReactNode
}

export function EntityCell({
  icon,
  iconClassName,
  title,
  subtitle,
}: EntityCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={cn(
          "border-primary/20 bg-primary/10 text-primary flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
          iconClassName
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-foreground group-hover:text-primary block truncate font-medium transition-colors">
          {title}
        </span>
        <p className="text-muted-foreground font-mono text-[11px]">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

// ── Toolbar ───────────────────────────────────────────────────────────────

export function Toolbar({
  card,
  children,
}: {
  card?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center",
        card && cn(CARD, "p-2.5")
      )}
    >
      {children}
    </div>
  )
}
