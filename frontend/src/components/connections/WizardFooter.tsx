import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WizardStep } from "@/hooks/useConnectionWizard"

interface WizardFooterProps {
  step: WizardStep
  isPending: boolean
  onBack: () => void
  onCancel: () => void
  onNextFromStep1: () => void
  onNextFromStep2: () => void
}

export function WizardFooter({
  step,
  isPending,
  onBack,
  onCancel,
  onNextFromStep1,
  onNextFromStep2,
}: WizardFooterProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div>
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={isPending}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {step === 1 && (
          <Button
            type="button"
            size="sm"
            onClick={onNextFromStep1}
            className="cursor-pointer gap-1.5 text-xs font-medium"
          >
            <span>Next: Credentials</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {step === 2 && (
          <Button
            type="button"
            size="sm"
            onClick={onNextFromStep2}
            className="gap-1.5 text-xs font-medium"
          >
            <span>Next: Test & Save</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {step === 3 && (
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="gap-1.5 text-xs font-medium"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>Save Connection</span>
          </Button>
        )}
      </div>
    </div>
  )
}
