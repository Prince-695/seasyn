import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Key, Loader2 } from "lucide-react"

interface DeleteRowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: Record<string, unknown> | null
  primaryKeys: string[]
  tableName: string
  onConfirmDelete: (pkValues: Record<string, unknown>) => Promise<void>
}

export function DeleteRowDialog({
  open,
  onOpenChange,
  row,
  primaryKeys,
  tableName,
  onConfirmDelete,
}: DeleteRowDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!row) return null

  // Extract primary key values
  const pkRecord: Record<string, unknown> = {}
  primaryKeys.forEach((key) => {
    pkRecord[key] = row[key]
  })

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirmDelete(pkRecord)
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete record.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle className="text-base font-bold">
              Delete Record from &apos;{tableName}&apos;?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs">
            This action deletes the row directly from the database connection.
            Cascading foreign key deletions may apply depending on relation
            constraints.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Primary Key Identification */}
        <div className="border-border/70 bg-muted/20 space-y-1.5 rounded-xl border p-3">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
            <Key className="h-3.5 w-3.5 text-amber-500" />
            <span>Target Primary Key Identification</span>
          </span>
          <div className="divide-border/50 divide-y font-mono text-xs">
            {Object.entries(pkRecord).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground max-w-55 truncate font-semibold">
                  {String(v ?? "NULL")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-2.5 text-xs">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5 text-xs font-semibold"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isDeleting ? "Deleting..." : "Delete Permanently"}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
