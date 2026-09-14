import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import type { SSLMode } from "@/types"

const OPTIONS: { value: SSLMode; label: string }[] = [
  { value: "disable", label: "Disable" },
  { value: "require", label: "Require" },
  { value: "verify-ca", label: "Verify CA" },
  { value: "verify-full", label: "Verify Full" },
  { value: "prefer", label: "Prefer" },
]

interface SslModeSelectProps {
  value: SSLMode | undefined
  onChange: (value: SSLMode) => void
  disabled?: boolean
}

export function SslModeSelect({
  value = "disable",
  onChange,
  disabled = false,
}: SslModeSelectProps) {
  const current = OPTIONS.find((o) => o.value === value)?.label || "Disable"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="border-border/80 bg-background h-8.5 min-w-36 cursor-pointer justify-between gap-2 rounded-lg px-3 text-xs font-medium"
          />
        }
      >
        <span>{current}</span>
        <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-lg p-1 shadow-md"
      >
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs"
          >
            <span>{opt.label}</span>
            {opt.value === value && (
              <Check className="text-primary h-3.5 w-3.5 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
