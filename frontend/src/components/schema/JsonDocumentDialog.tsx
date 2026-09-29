import { useState } from "react"
import { AlertCircle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/errors"

const SENSITIVE_KEYS_REGEX = /^(password|hash|secret|token|api_key)$/i

// Recursively redact sensitive keys with "[REDACTED]"
function redactDocument(doc: Record<string, unknown>): Record<string, unknown> {
  const redact = (val: unknown, keyName?: string): unknown => {
    if (keyName && SENSITIVE_KEYS_REGEX.test(keyName)) {
      return "[REDACTED]"
    }
    if (val === null || val === undefined) return val
    if (Array.isArray(val)) {
      return val.map((item) => redact(item))
    }
    if (typeof val === "object") {
      const res: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        res[k] = redact(v, k)
      }
      return res
    }
    return val
  }

  return redact(doc) as Record<string, unknown>
}

// Strip [REDACTED] values and sensitive keys before sending payload
function stripRedactedValues(val: unknown, keyName?: string): unknown {
  if (keyName && SENSITIVE_KEYS_REGEX.test(keyName)) {
    return undefined
  }
  if (val === "[REDACTED]") {
    return undefined
  }
  if (val === null || val === undefined) return val
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== "[REDACTED]")
      .map((item) => stripRedactedValues(item))
  }
  if (typeof val === "object") {
    const res: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const cleaned = stripRedactedValues(v, k)
      if (cleaned !== undefined) {
        res[k] = cleaned
      }
    }
    return res
  }
  return val
}

export interface JsonDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "edit" | "insert"
  collectionName: string
  document?: Record<string, unknown> | null
  onSubmit: (doc: Record<string, unknown>) => Promise<void>
}

export function JsonDocumentDialog({
  open,
  onOpenChange,
  mode,
  collectionName,
  document,
  onSubmit,
}: JsonDocumentDialogProps) {
  const isEdit = mode === "edit"
  const [jsonText, setJsonText] = useState(() => {
    if (isEdit && document) {
      return JSON.stringify(redactDocument(document), null, 2)
    }
    return (
      '{\n  "title": "New item",\n  "status": "active",\n  "createdAt": "' +
      new Date().toISOString() +
      '"\n}'
    )
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open || (isEdit && !document)) return null

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const parsed = JSON.parse(jsonText)
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Document must be a valid JSON object enclosed in curly braces {}."
        )
      }
      const data = isEdit
        ? (stripRedactedValues(parsed) as Record<string, unknown>)
        : parsed
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          isEdit
            ? "Invalid JSON syntax. Please verify quotes, brackets, and commas before saving."
            : "Invalid JSON syntax. Please verify key-value quotes and structure before inserting."
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-medium">
              {isEdit ? (
                "Edit Document JSON"
              ) : (
                <>
                  Insert Document into{" "}
                  <span className="text-primary font-mono">
                    {collectionName}
                  </span>
                </>
              )}
            </DialogTitle>
            {isEdit && (
              <Badge variant="outline" className="font-mono text-[10px]">
                BSON / JSON
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs">
            {isEdit
              ? "Directly update MongoDB document attributes. Valid JSON is required."
              : "Paste or compose the JSON document to insert. An `_id` will be generated if omitted."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && (
          <div className="border-warning/30 bg-warning/10 text-warning flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Sensitive fields are redacted and cannot be edited.</span>
          </div>
        )}

        <div className="w-full space-y-2 overflow-x-auto py-2">
          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              if (error) setError(null)
            }}
            rows={isEdit ? 14 : 12}
            className="border-code-border bg-code-bg text-code-foreground focus-visible:border-primary/60 focus-visible:ring-primary/20 w-full overflow-x-auto p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap ring-offset-0"
          />

          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-1.5 rounded-lg border p-2 text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Inserting..."
              : isEdit
                ? "Save Document"
                : "Insert Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
