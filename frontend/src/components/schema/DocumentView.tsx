import { useState, useMemo } from "react"
import {
  FileJson,
  Copy,
  Check,
  Trash2,
  Edit3,
  Plus,
  Braces,
  Search,
  Code2,
  Hash,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { JsonNode } from "./JsonNode"
import { JsonDocumentDialog } from "./JsonDocumentDialog"
import { DataViewPagination } from "./DataViewPagination"
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

  // Document Dialog State
  const [docToEdit, setDocToEdit] = useState<Record<string, unknown> | null>(null)
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
              {[
                { style: "tree" as const, label: "Document Cards", icon: Braces, iconColor: "text-success" },
                { style: "raw" as const, label: "Raw JSON", icon: Code2, iconColor: "text-primary" },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = viewStyle === tab.style
                return (
                  <Button
                    key={tab.style}
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setViewStyle(tab.style)}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", tab.iconColor)} />
                    <span>{tab.label}</span>
                  </Button>
                )
              })}
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
        /* Raw JSON View */
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
        /* Document Cards Tree View */
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
      <DataViewPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalDocuments}
        totalPages={totalPages}
        itemLabel="documents"
        isLoading={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        className="rounded-xl border p-3"
      />

      {/* Unified Edit Modal */}
      {docToEdit && (
        <JsonDocumentDialog
          key={String(
            docToEdit[primaryKeyField] ?? docToEdit._id ?? docToEdit.id
          )}
          open={!!docToEdit}
          onOpenChange={(isOpen) => !isOpen && setDocToEdit(null)}
          mode="edit"
          collectionName={collectionName}
          document={docToEdit}
          onSubmit={async (updated) => {
            if (onUpdateDocument && docToEdit) {
              await onUpdateDocument(docToEdit, updated)
            }
          }}
        />
      )}

      {/* Unified Insert Modal */}
      <JsonDocumentDialog
        open={insertModalOpen}
        onOpenChange={setInsertModalOpen}
        mode="insert"
        collectionName={collectionName}
        onSubmit={async (newDoc) => {
          if (onInsertDocument) {
            await onInsertDocument(newDoc)
          }
        }}
      />
    </div>
  )
}

export default DocumentView
