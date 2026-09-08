import { Database } from "lucide-react"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { WizardStep } from "@/hooks/useConnectionWizard"
import type { ENGINES } from "@/lib/constants/engines"

interface WizardProgressTrackerProps {
  step: WizardStep
  selectedEngineMeta: (typeof ENGINES)[number] | undefined
}

export function WizardProgressTracker({
  step,
  selectedEngineMeta,
}: WizardProgressTrackerProps) {
  return (
    <DialogHeader className="gap-1 pb-2">
      <div className="flex items-center justify-between">
        <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Database className="h-4 w-4" />
          <span>Database Adapter Setup</span>
        </div>
        {/* Step Progress Tracker */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-primary/20 text-primary"
            )}
          >
            1
          </span>
          <div
            className={cn(
              "h-0.5 w-6 rounded-full transition-colors",
              step >= 2 ? "bg-primary" : "bg-muted"
            )}
          />
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              step === 2
                ? "bg-primary text-primary-foreground"
                : step > 2
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            2
          </span>
          <div
            className={cn(
              "h-0.5 w-6 rounded-full transition-colors",
              step === 3 ? "bg-primary" : "bg-muted"
            )}
          />
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              step === 3
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            3
          </span>
        </div>
      </div>
      <DialogTitle className="text-lg font-bold">
        {step === 1 && "1. Select Engine & Role"}
        {step === 2 &&
          `2. Configure ${selectedEngineMeta?.name || "Database"} Adapter`}
        {step === 3 && "3. Verify & Save Connection"}
      </DialogTitle>
      <DialogDescription className="text-xs">
        {step === 1 &&
          "Choose the database engine type, name your adapter, and select its synchronization role."}
        {step === 2 &&
          "Enter connection endpoint parameters or paste a connection URI."}
        {step === 3 &&
          "Review adapter configuration and run live diagnostic latency check."}
      </DialogDescription>
    </DialogHeader>
  )
}
