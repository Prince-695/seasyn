import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Loader2 } from "lucide-react"

interface CancelMigrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isCancelling?: boolean
  jobName?: string
}

export function CancelMigrationDialog({
  open,
  onOpenChange,
  onConfirm,
  isCancelling = false,
  jobName,
}: CancelMigrationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border/80 bg-card max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex h-10 w-10 items-center justify-center rounded-xl border">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-foreground text-base">
                Cancel Migration?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-xs">
                {jobName ? jobName : "This will stop the data transfer."}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="bg-muted/30 border-border/60 text-muted-foreground rounded-lg border p-3 text-xs">
          <p>
            Already transferred rows will remain in the destination database,
            but no further data will be moved.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling} className="text-xs">
            Continue Running
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isCancelling}
            onClick={async (e) => {
              e.preventDefault()
              await onConfirm()
              onOpenChange(false)
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 text-xs font-medium"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Yes, Cancel Migration</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
