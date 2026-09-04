import { useState, useMemo } from "react"
import {
  FileJson,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit3,
  Plus,
  Braces,
  Search,
  Code2,
  AlertCircle,
  Hash,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"

interface DocumentViewProps {
  documents: Record<string, unknown>[]
  collectionName: string
  primaryKeyField?: string
  totalDocuments?: number
  currentPage?: number
  pageSize?: number
  totalPages?: number
  isLoading?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onUpdateDocument?: (
    originalDoc: Record<string, unknown>,
    updatedDoc: Record<string, unknown>
  ) => Promise<void>
  onDeleteDocument?: (doc: Record<string, unknown>) => Promise<void>
  onInsertDocument?: (newDoc: Record<string, unknown>) => Promise<void>
  onRefresh?: () => void
  className?: string
}

// Helper to determine accurate BSON / JSON type name
function getFieldType(val: unknown): string {
  if (val === null) return "null"
  if (val === undefined) return "undefined"
  if (Array.isArray(val)) return "array"
  if (typeof val === "object") {
    if ("$oid" in (val as Record<string, unknown>)) return "ObjectId"
    if ("$date" in (val as Record<string, unknown>)) return "Date"
    return "object"
  }
  if (typeof val === "string") {
    if (/^[0-9a-fA-F]{24}$/.test(val)) return "ObjectId"
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return "ISODate"
    return "string"
  }
  if (typeof val === "number") {
    return Number.isInteger(val) ? "int" : "double"
  }
  if (typeof val === "boolean") return "boolean"
  return typeof val
}

// Tree node for rendering individual JSON key-values with collapsible nesting
function JsonNode({
  keyName,
  value,
  depth = 0,
}: {
  keyName: string
  value: unknown
  depth?: number
}) {
  const type = getFieldType(value)
  const isExpandable =
    type === "object" ||
    type === "array" ||
    (typeof value === "object" && value !== null)
  const [isExpanded, setIsExpanded] = useState(depth < 2)

  return (
    <div className="font-mono text-xs leading-relaxed">
      <div
        className={cn(
          "hover:bg-muted/30 flex items-start gap-1.5 rounded-sm px-1 py-0.5 transition-colors",
          depth > 0 && "border-border/40 ml-4 border-l pl-2"
        )}
      >
        {isExpandable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground mt-0.5 h-auto w-auto shrink-0 cursor-pointer p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className="text-primary/90 font-semibold select-all">
          {keyName}:
        </span>

        {/* Type Badge */}
        <span
          className={cn(
            "rounded px-1 text-[10px] font-semibold tracking-wider uppercase",
            type === "ObjectId" &&
              "border-primary/20 bg-primary/10 text-primary border",
            type === "string" && "text-success",
            (type === "int" || type === "double") && "text-warning",
            type === "boolean" && "text-info",
            type === "array" && "text-muted-foreground",
            type === "object" && "text-muted-foreground",
            type === "ISODate" && "border-info/20 bg-info/10 text-info border",
            type === "null" && "text-muted-foreground"
          )}
        >
          {type === "array"
            ? `Array(${(value as unknown[]).length})`
            : type === "object"
              ? "Object"
              : type}
        </span>

        {/* Primitive Value Representation */}
        {!isExpandable && (
          <span className="text-foreground/90 break-all select-all">
            {type === "string"
              ? `"${String(value)}"`
              : type === "boolean"
                ? value
                  ? "true"
                  : "false"
                : type === "null"
                  ? "null"
                  : String(value)}
          </span>
        )}
      </div>

      {/* Recursive Nested Children */}
      {isExpandable && isExpanded && value !== null && (
        <div className="space-y-0.5">
          {Array.isArray(value)
            ? value.map((item, idx) => (
                <JsonNode
                  key={idx}
                  keyName={String(idx)}
                  value={item}
                  depth={depth + 1}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(
                ([nestedKey, nestedVal]) => (
                  <JsonNode
                    key={nestedKey}
                    keyName={nestedKey}
                    value={nestedVal}
                    depth={depth + 1}
                  />
                )
              )}
        </div>
      )}
    </div>
  )
}

const SENSITIVE_KEYS_REGEX = /^(password|hash|secret|token|api_key)$/i

// Recursively redact sensitive keys matching /^(password|hash|secret|token|api_key)$/i with "[REDACTED]"
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

// Strip any [REDACTED] values and sensitive keys before sending payload to prevent overwriting
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

// Modal for editing entire JSON Document
function EditDocumentDialog({
  open,
  onOpenChange,
  document,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Record<string, unknown> | null
  onSave: (updated: Record<string, unknown>) => Promise<void>
}) {
  const [jsonText, setJsonText] = useState(() =>
    document ? JSON.stringify(redactDocument(document), null, 2) : ""
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!open || !document) return null

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const parsed = JSON.parse(jsonText)
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Document must be a valid JSON object.")
      }
      const stripped = stripRedactedValues(parsed) as Record<string, unknown>
      await onSave(stripped)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-bold">
              Edit Document JSON
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              BSON / JSON
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Directly update MongoDB document attributes. Valid JSON is required.
          </DialogDescription>
        </DialogHeader>

        {/* Warning banner */}
        <div className="border-warning/30 bg-warning/10 text-warning flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Sensitive fields are redacted and cannot be edited.</span>
        </div>

        <div className="w-full space-y-2 overflow-x-auto py-2">
          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              if (error) setError(null)
            }}
            rows={14}
            className="border-code-border bg-code-bg text-code-foreground w-full overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap ring-offset-0"
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
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Modal for inserting a new JSON Document
function InsertDocumentDialog({
  open,
  onOpenChange,
  collectionName,
  onInsert,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionName: string
  onInsert: (doc: Record<string, unknown>) => Promise<void>
}) {
  const [jsonText, setJsonText] = useState(
    '{\n  "title": "New item",\n  "status": "active",\n  "createdAt": "' +
      new Date().toISOString() +
      '"\n}'
  )
  const [error, setError] = useState<string | null>(null)
  const [inserting, setInserting] = useState(false)

  if (!open) return null

  const handleInsert = async () => {
    setError(null)
    setInserting(true)
    try {
      const parsed = JSON.parse(jsonText)
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Document must be a valid JSON object.")
      }
      await onInsert(parsed)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON syntax.")
    } finally {
      setInserting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-bold">
              Insert Document into{" "}
              <span className="text-primary font-mono">{collectionName}</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Paste or compose the JSON document to insert. An `_id` will be
            generated if omitted.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full space-y-2 overflow-x-auto py-2">
          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              if (error) setError(null)
            }}
            rows={12}
            className="border-code-border bg-code-bg text-code-foreground w-full overflow-x-auto font-mono text-xs break-all whitespace-pre-wrap ring-offset-0"
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
            disabled={inserting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleInsert}
            disabled={inserting}
          >
            {inserting ? "Inserting..." : "Insert Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DocumentView({
  documents,
  collectionName,
  primaryKeyField = "_id",
  totalDocuments = documents.length,
  currentPage = 1,
  pageSize = 25,
  totalPages = Math.ceil(totalDocuments / pageSize) || 1,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onUpdateDocument,
  onDeleteDocument,
  onInsertDocument,
  onRefresh,
  className,
}: DocumentViewProps) {
  const [viewStyle, setViewStyle] = useState<"tree" | "raw">("tree")
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  // Document Editing
  const [docToEdit, setDocToEdit] = useState<Record<string, unknown> | null>(
    null
  )
  const [insertModalOpen, setInsertModalOpen] = useState(false)

  // Filter documents by search string
  const filteredDocs = useMemo(() => {
    if (!searchTerm.trim()) return documents
    const term = searchTerm.toLowerCase()
    return documents.filter((doc) =>
      JSON.stringify(doc).toLowerCase().includes(term)
    )
  }, [documents, searchTerm])

  const handleCopyDocJson = async (
    doc: Record<string, unknown>,
    id: string
  ) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(doc, null, 2))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {
      // ignore
    }
  }

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(filteredDocs, null, 2))
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Sub-header Toolbar ── */}
      <div className="border-border/70 bg-card rounded-xl border p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Tree vs Raw JSON */}
            <div className="border-border/70 bg-muted/30 flex items-center gap-1 rounded-lg border p-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setViewStyle("tree")}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  viewStyle === "tree"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Braces className="text-success h-3.5 w-3.5" />
                <span>Document Cards</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setViewStyle("raw")}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  viewStyle === "raw"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Code2 className="text-primary h-3.5 w-3.5" />
                <span>Raw JSON</span>
              </Button>
            </div>

            {/* Document Count Info */}
            <span className="text-muted-foreground font-mono text-xs">
              Showing {filteredDocs.length} of {totalDocuments} documents
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Filter */}
            <div className="relative w-48 sm:w-60">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search JSON keys & values..."
                className="h-8 pl-8 text-xs ring-offset-0"
              />
            </div>

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 gap-1.5 text-xs"
                title="Refresh documents"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
                />
              </Button>
            )}

            {viewStyle === "raw" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                {copiedAll ? (
                  <Check className="text-success h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedAll ? "Copied" : "Copy JSON"}</span>
              </Button>
            )}

            {onInsertDocument && (
              <Button
                size="sm"
                onClick={() => setInsertModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Insert Document</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Content Area ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border/70 bg-card h-32 animate-pulse rounded-xl border p-4"
            />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="border-border/70 bg-card rounded-xl border p-12 text-center shadow-xs">
          <FileJson className="text-muted-foreground/40 mx-auto mb-3 h-10 w-10" />
          <h3 className="text-foreground text-sm font-semibold">
            {searchTerm ? "No documents match query" : "Collection is Empty"}
          </h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
            {searchTerm
              ? "Try adjusting your filter search query to find documents."
              : `The collection "${collectionName}" contains no documents yet.`}
          </p>
          {onInsertDocument && !searchTerm && (
            <Button
              size="sm"
              onClick={() => setInsertModalOpen(true)}
              className="mt-4 gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Insert First Document</span>
            </Button>
          )}
        </div>
      ) : viewStyle === "raw" ? (
        /* ── Raw JSON View ── */
        <div className="border-border/80 bg-code-bg relative overflow-hidden rounded-xl border shadow-inner">
          <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-4 py-2">
            <span className="text-muted-foreground font-mono text-xs">
              {collectionName}.json ({filteredDocs.length} items)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              className="text-muted-foreground hover:text-foreground h-6 gap-1 text-[11px]"
            >
              {copiedAll ? (
                <Check className="text-success h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copiedAll ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <pre className="text-code-foreground max-h-155 overflow-auto p-4 font-mono text-xs leading-relaxed">
            {JSON.stringify(filteredDocs, null, 2)}
          </pre>
        </div>
      ) : (
        /* ── Document Cards Tree View ── */
        <div className="space-y-3">
          {filteredDocs.map((doc, index) => {
            const docId = String(
              doc[primaryKeyField] ?? doc._id ?? doc.id ?? `doc-${index}`
            )
            const fieldCount = Object.keys(doc).length

            return (
              <div
                key={docId}
                className="border-border/70 bg-card hover:border-border rounded-xl border p-4 shadow-xs transition-all duration-150"
              >
                {/* Document Card Header */}
                <div className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-muted/40 text-muted-foreground flex h-5 w-6 items-center justify-center rounded font-mono text-[10px] font-semibold">
                      #{index + 1 + (currentPage - 1) * pageSize}
                    </span>

                    <div className="text-foreground flex items-center gap-1.5 font-mono text-xs font-bold">
                      <Hash className="text-muted-foreground h-3.5 w-3.5" />
                      <span>{docId}</span>
                    </div>

                    <Badge
                      variant="outline"
                      className="border-border/80 bg-muted/20 font-mono text-[10px]"
                    >
                      {fieldCount} fields
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyDocJson(doc, docId)}
                      className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
                      title="Copy Document JSON"
                    >
                      {copiedId === docId ? (
                        <Check className="text-success h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedId === docId ? "Copied" : "Copy"}</span>
                    </Button>

                    {onUpdateDocument && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocToEdit(doc)}
                        className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
                        title="Edit Document JSON"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                    )}

                    {onDeleteDocument && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteDocument(doc)}
                        className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Document Body Tree */}
                <div className="space-y-1 pt-3">
                  {Object.entries(doc).map(([k, v]) => (
                    <JsonNode key={k} keyName={k} value={v} depth={0} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="border-border/60 bg-muted/20 text-muted-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs">
        <div className="flex items-center gap-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalDocuments)} of{" "}
            {totalDocuments.toLocaleString()} documents
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
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
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

      {/* Edit Modal */}
      {docToEdit && (
        <EditDocumentDialog
          key={String(
            docToEdit[primaryKeyField] ?? docToEdit._id ?? docToEdit.id
          )}
          open={!!docToEdit}
          onOpenChange={(isOpen) => !isOpen && setDocToEdit(null)}
          document={docToEdit}
          onSave={async (updated) => {
            if (onUpdateDocument && docToEdit) {
              await onUpdateDocument(docToEdit, updated)
            }
          }}
        />
      )}

      {/* Insert Modal */}
      <InsertDocumentDialog
        open={insertModalOpen}
        onOpenChange={setInsertModalOpen}
        collectionName={collectionName}
        onInsert={async (newDoc) => {
          if (onInsertDocument) {
            await onInsertDocument(newDoc)
          }
        }}
      />
    </div>
  )
}
